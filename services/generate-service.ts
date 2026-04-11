import {
  ErrorOrigin,
  explainStreamConnectionError,
  withErrorOrigin,
} from "@/lib/dify-errors";
import type { GenerateApiErrorJson } from "@/types/generate";

type StreamGenerateArgs = {
  prompt: string;
  signal: AbortSignal;
  onChunk: (text: string) => void;
};

/** Client → POST `/api/generate` (JSON เท่านั้น) */
export async function streamGenerate(args: StreamGenerateArgs): Promise<void> {
  const { prompt, signal, onChunk } = args;

  let res: Response;
  try {
    res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
      signal,
    });
  } catch (e) {
    throw new Error(
      withErrorOrigin(
        ErrorOrigin.clientFetchApiGenerate,
        explainStreamConnectionError(e),
      ),
    );
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as GenerateApiErrorJson;
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
    const detail = explainStreamConnectionError(e);
    if (accumulated.trim()) {
      onChunk(
        `${accumulated}\n\n[แจ้งจากแอป] ${withErrorOrigin(ErrorOrigin.clientReadResponseStream, detail)} — แสดงเฉพาะข้อความที่โหลดได้แล้ว`,
      );
      return;
    }
    throw new Error(withErrorOrigin(ErrorOrigin.clientReadResponseStream, detail));
  } finally {
    reader.releaseLock();
  }

  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("[Dify] ความยาวข้อความที่รับครบ:", accumulated.length);
    console.log("[Dify] ข้อความจากโมเดล (ดิบ):", accumulated);
  }

  if (!accumulated.trim()) {
    onChunk(
      [
        withErrorOrigin(
          ErrorOrigin.clientReadResponseStream,
          "เชื่อมต่อสำเร็จแต่ไม่ได้รับข้อความจากสตรีม (ความยาวรวม 0 หลังอ่านจบ)",
        ),
        "",
        "ถ้าใช้ Workflow + RAG: ตรวจว่าโหนด Knowledge retrieval ผูกกับ Knowledge ที่มีเอกสาร และตัวแปรออกสุดท้ายเป็นข้อความ/JSON",
        "• เปิด streaming ที่โหนด LLM (ถ้ามี)",
        "• รัน Trace ใน Dify ว่ามีข้อความใน outputs ของโหนดสุดท้ายหรือไม่",
      ].join("\n"),
    );
  }
}
