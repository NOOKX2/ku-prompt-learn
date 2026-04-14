import {
  ErrorOrigin,
  explainStreamConnectionError,
  isAbortLike,
  withErrorOrigin,
} from "@/lib/dify-errors";
import type { DifyUploadedFileRef } from "@/lib/dify/types";
import type { GenerateApiErrorJson } from "@/types/generate";

const LOG = "[generate-client]";

export type StreamGenerateArgs = {
  prompt: string;
  signal: AbortSignal;
  onChunk: (text: string) => void;
  workflowFiles?: DifyUploadedFileRef[];
};

/** Client → POST `/api/generate` (JSON) — คืนข้อความรวมหลังอ่านสตรีมจบ — ล็อกขั้นตอนใน console เมื่อ error */
export async function streamGenerate(args: StreamGenerateArgs): Promise<string> {
  const { prompt, signal, onChunk, workflowFiles } = args;

  const payload: { prompt: string; workflowFiles?: DifyUploadedFileRef[] } = { prompt };
  if (workflowFiles?.length) {
    payload.workflowFiles = workflowFiles;
  }

  let res: Response;
  try {
    res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (e) {
    if (isAbortLike(e) || signal.aborted) {
      throw e instanceof Error ? e : new DOMException("Aborted", "AbortError");
    }
    console.error(
      `${LOG} ① fetch /api/generate ล้ม (เครือข่าย / CORS)`,
      explainStreamConnectionError(e),
      e,
    );
    throw new Error(
      withErrorOrigin(
        ErrorOrigin.clientFetchApiGenerate,
        explainStreamConnectionError(e),
      ),
    );
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as GenerateApiErrorJson;
    console.error(`${LOG} ② HTTP ไม่สำเร็จ`, {
      status: res.status,
      statusText: res.statusText,
      contentType: res.headers.get("content-type"),
      body: data,
    });
    const parts = [
      data.error && data.difyCode ? `${data.error} (${data.difyCode})` : data.error,
      data.hint,
    ].filter(Boolean);
    const body = parts.join("\n\n") || `HTTP ${res.status} ไม่มีรายละเอียด`;
    const msg = body.trimStart().startsWith("[")
      ? body
      : withErrorOrigin(
          `${ErrorOrigin.clientFetchApiGenerate} → เซิร์ฟเวอร์ตอบ HTTP ${res.status}`,
          body,
        );
    throw new Error(msg);
  }

  if (!res.body) {
    console.error(`${LOG} ③ Response ไม่มี readable body`, {
      status: res.status,
      contentType: res.headers.get("content-type"),
    });
    throw new Error(
      withErrorOrigin(
        ErrorOrigin.clientReadResponseStream,
        "ไม่ได้รับ body สตรีมจากแอป (Response ไม่มี readable stream)",
      ),
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      accumulated += chunk;
      onChunk(accumulated);
    }
  } catch (e) {
    if (isAbortLike(e) || signal.aborted) {
      throw e instanceof Error ? e : new DOMException("Aborted", "AbortError");
    }
    const detail = explainStreamConnectionError(e);
    console.error(`${LOG} ④ อ่านสตรีม body ล้ม`, {
      detail,
      bytesSoFar: accumulated.length,
      error: e,
    });
    if (accumulated.trim()) {
      const next = `${accumulated}\n\n[แจ้งจากแอป] ${withErrorOrigin(ErrorOrigin.clientReadResponseStream, detail)} — แสดงเฉพาะข้อความที่โหลดได้แล้ว`;
      onChunk(next);
      return next;
    }
    throw new Error(withErrorOrigin(ErrorOrigin.clientReadResponseStream, detail));
  } finally {
    reader.releaseLock();
  }

  if (
    typeof process !== "undefined" &&
    process.env.NODE_ENV === "development" &&
    accumulated.length > 0
  ) {
    console.log("[Dify] ความยาวข้อความที่รับครบ:", accumulated.length);
    console.log("[Dify] ข้อความจากโมเดล (ดิบ):", accumulated);
  }

  if (!accumulated.trim()) {
    console.error(`${LOG} ⑤ อ่านสตรีมจบแล้วแต่ความยาวรวม 0`, {
      status: res.status,
      contentType: res.headers.get("content-type"),
      hint: "เซิร์ฟเวอร์อาจส่งสตรีมว่าง — ตรวจ workflow_finished / blocking JSON ใน Dify",
      devHint:
        "เปิด DevTools → Network → คลิก request /api/generate → Response ดูว่ามี SSE (data: {...}) หรือไม่",
    });
    const next = [
      withErrorOrigin(
        ErrorOrigin.clientReadResponseStream,
        "เชื่อมต่อสำเร็จแต่ไม่ได้รับข้อความจากสตรีม (ความยาวรวม 0 หลังอ่านจบ)",
      ),
      "",
      "ถ้าใช้ Workflow + RAG: ตรวจว่าโหนด Knowledge retrieval ผูกกับ Knowledge ที่มีเอกสาร และตัวแปรออกสุดท้ายเป็นข้อความ/JSON",
      "• เปิด streaming ที่โหนด LLM (ถ้ามี)",
      "• รัน Trace ใน Dify ว่ามีข้อความใน outputs ของโหนดสุดท้ายหรือไม่",
    ].join("\n");
    onChunk(next);
    return next;
  }

  return accumulated;
}
