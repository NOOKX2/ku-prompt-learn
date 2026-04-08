/**
 * อ่านสตรีม SSE จาก Dify
 * - chat: chat-messages / completion-messages (event message / agent_message + answer)
 * - workflow: text_chunk (data.text) — ถ้าไม่มี chunk ใดๆ จะลองดึงจาก workflow_finished.outputs
 */

type DifyStreamEvent = {
  event?: string;
  answer?: string;
  message?: string;
  data?: unknown;
};

/** ดึงข้อความจาก outputs ของ Workflow (โครงสร้างตามเวอร์ชัน Dify อาจซ้อนกัน) */
function extractStringFromOutputs(outputs: unknown, depth = 0): string | null {
  if (depth > 8) return null;
  if (outputs == null) return null;
  if (typeof outputs === "string" && outputs.trim()) return outputs;
  if (Array.isArray(outputs)) {
    const parts = outputs
      .map((x) => extractStringFromOutputs(x, depth + 1))
      .filter((x): x is string => typeof x === "string" && x.length > 0);
    return parts.length ? parts.join("\n\n") : null;
  }
  if (typeof outputs !== "object") return null;
  const o = outputs as Record<string, unknown>;
  for (const key of ["text", "answer", "output", "result", "content"]) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v;
  }
  for (const v of Object.values(o)) {
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
    extractStringFromOutputs(d.outputs) ?? extractStringFromOutputs(d.output);
  if (!text && d.data != null && typeof d.data === "object") {
    const inner = d.data as Record<string, unknown>;
    text =
      extractStringFromOutputs(inner.outputs) ??
      extractStringFromOutputs(inner.output) ??
      extractStringFromOutputs(inner);
  }
  if (text) return text;
  return extractStringFromOutputs(d);
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
    const d = parsed.data as Record<string, unknown>;
    if (typeof d.text === "string" && d.text.length > 0) {
      return d.text;
    }
  }

  if (
    (ev === "message" || ev === "agent_message") &&
    typeof parsed.answer === "string" &&
    parsed.answer.length > 0
  ) {
    return parsed.answer;
  }

  if (mode === "workflow" && (ev === "message" || ev === "agent_message")) {
    const data = parsed.data;
    if (data != null && typeof data === "object") {
      const dd = data as Record<string, unknown>;
      if (typeof dd.answer === "string" && dd.answer.length > 0) return dd.answer;
      if (typeof dd.text === "string" && dd.text.length > 0) return dd.text;
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
        /** Workflow: มี text_chunk / message แล้ว — อย่าแปะ outputs จาก workflow_finished ซ้ำ */
        let workflowStreamed = false;
        try {
          const handleEvent = (parsed: DifyStreamEvent) => {
            if (parsed.event === "error") {
              const msg =
                typeof parsed.message === "string"
                  ? parsed.message
                  : JSON.stringify(parsed.data ?? parsed);
              controller.enqueue(
                encoder.encode(`\n\n[ข้อผิดพลาดจาก Dify] ${msg}`),
              );
              controller.close();
              return true;
            }

            const chunk = extractChunk(parsed, mode);
            if (chunk) {
              if (mode === "workflow") workflowStreamed = true;
              controller.enqueue(encoder.encode(chunk));
              return false;
            }

            if (
              mode === "workflow" &&
              !workflowStreamed &&
              parsed.event === "workflow_finished"
            ) {
              const fallback = extractWorkflowFinishedText(parsed);
              if (fallback) {
                workflowStreamed = true;
                controller.enqueue(encoder.encode(fallback));
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
          const msg = e instanceof Error ? e.message : String(e);
          controller.enqueue(encoder.encode(`\n\n[ข้อผิดพลาด] ${msg}`));
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
