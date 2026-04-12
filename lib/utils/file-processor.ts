import type { DifyUploadedFileRef } from "@/lib/dify/types";

export class ParseRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ParseRequestError";
  }
}

const UUID_RE =
  /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

function parseWorkflowFilesField(body: unknown): DifyUploadedFileRef[] | undefined {
  if (typeof body !== "object" || body === null || !("workflowFiles" in body)) {
    return undefined;
  }
  const raw = (body as { workflowFiles?: unknown }).workflowFiles;
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  if (raw.length > 15) {
    throw new ParseRequestError("workflowFiles เกิน 15 รายการ", 400);
  }
  const out: DifyUploadedFileRef[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const id = typeof o.upload_file_id === "string" ? o.upload_file_id.trim() : "";
    if (!UUID_RE.test(id)) continue;
    if (o.transfer_method !== "local_file") continue;
    const ty =
      o.type === "document" || o.type === "image" || o.type === "audio" || o.type === "video"
        ? o.type
        : "document";
    out.push({ type: ty, transfer_method: "local_file", upload_file_id: id });
  }
  return out.length ? out : undefined;
}

/** รับ JSON { prompt, workflowFiles? } — ไฟล์ PDF อัปโหลดไป Dify แยกที่ /api/dify-upload แล้วส่ง id มาที่นี่ */
export async function parseIncomingRequest(
  req: Request,
): Promise<{ prompt: string; workflowFiles?: DifyUploadedFileRef[] }> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    throw new ParseRequestError(
      "ไม่รับ multipart ที่ /api/generate — อัปโหลด PDF ที่ /api/dify-upload แล้วส่ง workflowFiles ใน JSON",
      415,
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ParseRequestError(
      'รูปแบบคำขอไม่ถูกต้อง — ต้องเป็น JSON { "prompt": "..." } หรือมี workflowFiles จากอัปโหลด Dify',
      400,
    );
  }

  const prompt =
    typeof body === "object" &&
    body !== null &&
    "prompt" in body &&
    typeof (body as { prompt?: unknown }).prompt === "string"
      ? (body as { prompt: string }).prompt.trim()
      : "";

  const workflowFiles = parseWorkflowFilesField(body);

  return { prompt, workflowFiles };
}
