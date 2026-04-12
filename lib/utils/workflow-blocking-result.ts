import { extractStringFromOutputs } from "@/lib/dify/chat-stream";
import { stringifyWorkflowOutputFallback } from "@/lib/dify/workflow-output-fallback";

/** แปลง body JSON ของ POST /workflows/run แบบ response_mode=blocking เป็นข้อความเดียว */
export function textFromDifyWorkflowBlockingBody(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const b = body as Record<string, unknown>;

  if (typeof b.answer === "string" && b.answer.trim()) return b.answer.trim();

  const direct =
    extractStringFromOutputs(b.outputs) ??
    extractStringFromOutputs(b.output) ??
    extractStringFromOutputs(b.result);
  if (direct) return direct.trim();

  const fallRoot =
    stringifyWorkflowOutputFallback(b.outputs) ??
    stringifyWorkflowOutputFallback(b.output) ??
    stringifyWorkflowOutputFallback(b.result);
  if (fallRoot) return fallRoot;

  const data = b.data;
  if (data != null && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const inner =
      extractStringFromOutputs(d.outputs) ??
      extractStringFromOutputs(d.output) ??
      extractStringFromOutputs(d.result);
    if (inner) return inner.trim();

    const fallData =
      stringifyWorkflowOutputFallback(d.outputs) ??
      stringifyWorkflowOutputFallback(d.output) ??
      stringifyWorkflowOutputFallback(d.result);
    if (fallData) return fallData;
  }

  return "";
}
