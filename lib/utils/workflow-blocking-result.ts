import { extractStringFromOutputs } from "@/lib/dify/chat-stream";

/** แปลง body JSON ของ POST /workflows/run แบบ response_mode=blocking เป็นข้อความเดียว */
export function textFromDifyWorkflowBlockingBody(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const b = body as Record<string, unknown>;
  const direct =
    extractStringFromOutputs(b.outputs) ??
    extractStringFromOutputs(b.output) ??
    extractStringFromOutputs(b.result);
  if (direct) return direct.trim();

  const data = b.data;
  if (data != null && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const inner =
      extractStringFromOutputs(d.outputs) ??
      extractStringFromOutputs(d.output) ??
      extractStringFromOutputs(d.result);
    if (inner) return inner.trim();
  }

  return "";
}
