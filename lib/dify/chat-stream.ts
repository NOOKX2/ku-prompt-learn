import {
  ErrorOrigin,
  explainStreamConnectionError,
  withErrorOrigin,
} from "@/lib/dify-errors";

/**
 * อ่านสตรีม SSE จาก Dify
 * - chat: message / agent_message + answer
 * - workflow: text_chunk (text|delta|…), node_finished.outputs, workflow_finished, message_replace
 */

type DifyStreamEvent = {
  event?: string;
  answer?: string;
  message?: string;
  data?: unknown;
};

/** ไม่เอาสตริงที่เป็นแค่ UUID มาเป็นคำตอบ (มักเป็น id / task_id ใน event ของ Dify) */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isBareUuid(s: string): boolean {
  return UUID_RE.test(s.trim());
}

/** คีย์ metadata ของ Dify — ห้ามใช้เป็นข้อความตอบ */
const OUTPUT_SKIP_KEYS = new Set([
  "id",
  "task_id",
  "workflow_id",
  "workflow_run_id",
  "message_id",
  "conversation_id",
  "node_id",
  "execution_id",
  "run_id",
  "created_at",
  "updated_at",
]);

/**
 * คีย์ที่มักเป็นสำเนา input / คำสั่งจากผู้ใช้ใน payload รวมของ workflow —
 * ห้ามเลือกก่อนผลจาก LLM (มิฉะนั้น UI จะได้แค่ prompt ที่ส่งไป)
 */
const OUTPUT_INPUT_ECHO_KEYS = new Set([
  "prompt",
  "query",
  "input",
  "user_input",
  "userInput",
  "user_query",
  "instruction",
]);

function isUsableText(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (isBareUuid(t)) return false;
  return true;
}

/** Dify บางเวอร์ชันส่งค่า user ต่อหน้า { โดยไม่มีช่องว่าง หรือเป็นทั้ง chunk */
function stripLeadingUserIdLeak(s: string): string {
  const user =
    typeof process !== "undefined" && process.env?.DIFY_USER?.trim()
      ? process.env.DIFY_USER.trim()
      : "ku-prompt-learn";
  const t = s.trim();
  if (t === user) return "";
  const escaped = user.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return s.replace(new RegExp(`^${escaped}(?=\\s*\\{)`), "");
}

/** ดึงข้อความจาก outputs ของ Workflow (โครงสร้างตามเวอร์ชัน Dify อาจซ้อนกัน) — export สำหรับโหมด blocking */
export function extractStringFromOutputs(outputs: unknown, depth = 0): string | null {
  if (depth > 8) return null;
  if (outputs == null) return null;
  if (typeof outputs === "number" || typeof outputs === "boolean") {
    return String(outputs);
  }
  if (typeof outputs === "string") {
    return isUsableText(outputs) ? outputs.trim() : null;
  }
  if (Array.isArray(outputs)) {
    const parts = outputs
      .map((x) => extractStringFromOutputs(x, depth + 1))
      .filter((x): x is string => typeof x === "string" && x.length > 0);
    return parts.length ? parts.join("\n\n") : null;
  }
  if (typeof outputs !== "object") return null;
  const o = outputs as Record<string, unknown>;
  for (const key of [
    "text",
    "textString",
    "answer",
    "output",
    "result",
    "content",
    "body",
    "response",
    "reply",
    "json",
    "markdown",
    "message",
    "llm",
    "output_text",
    "structured_output",
    "output_json",
    "value",
  ]) {
    const v = o[key];
    if (typeof v === "string" && isUsableText(v)) return v.trim();
  }
  for (const [k, v] of Object.entries(o)) {
    if (OUTPUT_SKIP_KEYS.has(k)) continue;
    if (OUTPUT_INPUT_ECHO_KEYS.has(k)) continue;
    const found = extractStringFromOutputs(v, depth + 1);
    if (found) return found;
  }
  return null;
}

function extractWorkflowFinishedText(parsed: DifyStreamEvent): string | null {
  if (parsed.event !== "workflow_finished") return null;
  const data = parsed.data;
  if (data == null || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  let text =
    extractStringFromOutputs(d.outputs) ??
    extractStringFromOutputs(d.output) ??
    (typeof d.result === "string" && isUsableText(d.result) ? d.result.trim() : null);
  if (!text && d.data != null && typeof d.data === "object") {
    const inner = d.data as Record<string, unknown>;
    text =
      extractStringFromOutputs(inner.outputs) ??
      extractStringFromOutputs(inner.output) ??
      extractStringFromOutputs(inner);
  }
  return text;
  /* ห้ามเรียก extractStringFromOutputs(d) กับทั้ง event — จะไปเก็บ id/task_id เป็น "คำตอบ" */
}

function extractTextChunkData(data: unknown): string | null {
  if (typeof data === "string" && isUsableText(data)) return data;
  if (data == null || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  for (const key of ["text", "textString", "delta", "content", "chunk"]) {
    const v = d[key];
    if (typeof v === "string" && isUsableText(v)) return v;
  }
  return null;
}

function extractNodeOutputsText(data: unknown): string | null {
  if (data == null || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  return (
    extractStringFromOutputs(d.outputs) ??
    extractStringFromOutputs(d.output) ??
    extractStringFromOutputs(d.result)
  );
}

function extractChunk(
  parsed: DifyStreamEvent,
  mode: "chat" | "workflow",
): string | null {
  const ev = parsed.event;

  if (ev === "error") {
    return null;
  }

  if (mode === "workflow" && ev === "text_chunk" && parsed.data != null) {
    const fromData = extractTextChunkData(parsed.data);
    if (fromData) return fromData;
  }

  /** บาง workflow ส่งข้อความเฉพาะตอน node จบ ไม่มี text_chunk */
  if (mode === "workflow" && ev === "node_finished" && parsed.data != null) {
    const fromNode = extractNodeOutputsText(parsed.data);
    if (fromNode) return fromNode;
  }

  if (mode === "workflow" && parsed.data != null) {
    if (ev === "message_replace" || ev === "text_replace") {
      const fromData = extractTextChunkData(parsed.data);
      if (fromData) return fromData;
      const dd = parsed.data as Record<string, unknown>;
      if (typeof dd.answer === "string" && isUsableText(dd.answer)) return dd.answer;
    }
  }

  if (
    (ev === "message" || ev === "agent_message") &&
    typeof parsed.answer === "string" &&
    isUsableText(parsed.answer)
  ) {
    return parsed.answer;
  }

  if (mode === "workflow" && (ev === "message" || ev === "agent_message")) {
    const data = parsed.data;
    if (data != null && typeof data === "object") {
      const dd = data as Record<string, unknown>;
      if (typeof dd.answer === "string" && isUsableText(dd.answer)) return dd.answer;
      if (typeof dd.text === "string" && isUsableText(dd.text)) return dd.text;
      const nested = extractTextChunkData(data);
      if (nested) return nested;
    }
  }

  return null;
}

function createSseParser(
  mode: "chat" | "workflow",
): (body: ReadableStream<Uint8Array>) => ReadableStream<Uint8Array> {
  return (body: ReadableStream<Uint8Array>) => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let buffer = "";

    return new ReadableStream({
      async start(controller) {
        const reader = body.getReader();
        /**
         * Workflow: ถ้าเคยส่งข้อความจริงไปแล้ว — อย่าแปะ outputs จาก workflow_finished ซ้ำ
         * (ต้องนับเฉพาะตอน enqueue สำเร็จ ไม่ใช่แค่มี chunk จาก extract — มิฉะนั้น
         * chunk ที่ถูก strip เป็นว่าง เช่น แค่ user id จะทำให้ตัด fallback workflow_finished ทิ้ง)
         */
        let workflowEmitted = false;
        /** กัน workflow ส่งก้อน JSON/ข้อความเดิมซ้ำหลาย event (node_finished ซ้ำ ฯลฯ) */
        let lastEmittedChunk = "";
        try {
          const enqueueText = (raw: string) => {
            const text = stripLeadingUserIdLeak(raw).trim();
            if (!text) return;
            if (text.length >= 32 && text === lastEmittedChunk) {
              return;
            }
            lastEmittedChunk = text;
            controller.enqueue(encoder.encode(text));
            if (mode === "workflow") workflowEmitted = true;
          };

          const handleEvent = (parsed: DifyStreamEvent) => {
            if (parsed.event === "error") {
              const msg =
                typeof parsed.message === "string"
                  ? parsed.message
                  : JSON.stringify(parsed.data ?? parsed);
              controller.enqueue(
                encoder.encode(
                  `\n\n${withErrorOrigin(ErrorOrigin.difySseEventError, msg)}`,
                ),
              );
              controller.close();
              return true;
            }

            const chunk = extractChunk(parsed, mode);
            if (chunk) {
              enqueueText(chunk);
              return false;
            }

            if (
              mode === "workflow" &&
              !workflowEmitted &&
              parsed.event === "workflow_finished"
            ) {
              const fallback = extractWorkflowFinishedText(parsed);
              if (fallback) {
                enqueueText(fallback);
              }
            }
            return false;
          };

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const parts = buffer.split("\n");
            buffer = parts.pop() ?? "";

            for (const rawLine of parts) {
              const trimmed = rawLine.trim();
              if (!trimmed.startsWith("data:")) continue;
              const payload = trimmed.slice(5).trim();
              if (!payload || payload === "[DONE]") continue;

              let parsed: DifyStreamEvent;
              try {
                parsed = JSON.parse(payload) as DifyStreamEvent;
              } catch {
                continue;
              }

              if (handleEvent(parsed)) return;
            }
          }

          if (buffer.trim()) {
            const trimmed = buffer.trim();
            if (trimmed.startsWith("data:")) {
              const payload = trimmed.slice(5).trim();
              if (payload && payload !== "[DONE]") {
                try {
                  const parsed = JSON.parse(payload) as DifyStreamEvent;
                  if (handleEvent(parsed)) return;
                } catch {
                  /* ignore */
                }
              }
            }
          }

          controller.close();
        } catch (e) {
          const msg = explainStreamConnectionError(
            e,
            `[${ErrorOrigin.serverSseParser}]`,
          );
          controller.enqueue(
            encoder.encode(`\n\n[ข้อผิดพลาด] ${msg}`),
          );
          controller.close();
        }
      },
    });
  };
}

/** Chat / Completion API */
export function difySseToTextStream(
  body: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  return createSseParser("chat")(body);
}

/** Workflow API (/workflows/run) — รวม text_chunk */
export function difySseToTextStreamWorkflow(
  body: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  return createSseParser("workflow")(body);
}
