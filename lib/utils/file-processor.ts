export class ParseRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ParseRequestError";
  }
}

/** รับเฉพาะ JSON — เอกสารอ้างอิงให้อัปโหลดที่ Knowledge / RAG ใน Dify แล้วส่งแค่คำสั่งเป็นข้อความ */
export async function parseIncomingRequest(
  req: Request,
): Promise<{ prompt: string }> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    throw new ParseRequestError(
      "ไม่รับอัปโหลดไฟล์ผ่าน API แล้ว — อัปโหลดเอกสารไปที่ Knowledge (RAG) ใน Dify แล้วพิมพ์คำสั่ง/คำค้นจากแอปเท่านั้น",
      415,
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ParseRequestError(
      "รูปแบบคำขอไม่ถูกต้อง — ต้องเป็น JSON { \"prompt\": \"...\" }",
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

  return { prompt };
}
