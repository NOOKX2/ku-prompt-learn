import {
  ErrorOrigin,
  withErrorOrigin,
} from "@/lib/dify-errors";
import { createKnowledgeDocumentFromFile } from "@/lib/dify/knowledge-upload";

export const runtime = "nodejs";

const MAX_BYTES = 15 * 1024 * 1024;

/**
 * เพิ่มไฟล์เข้า Knowledge เท่านั้น (ไม่เรียก /files/upload)
 * ใช้เมื่อ `DIFY_PDF_HANDLING=extract` แต่ต้องการให้ PDF ไป Knowledge ด้วย
 */
export async function POST(req: Request) {
  const datasetId = process.env.DIFY_DATASET_ID?.trim();
  const datasetApiKey = process.env.DIFY_DATASET_API_KEY?.trim();
  if (!datasetId || !datasetApiKey) {
    return Response.json(
      {
        error: withErrorOrigin(
          ErrorOrigin.serverConfig,
          "ต้องตั้ง DIFY_DATASET_ID และ DIFY_DATASET_API_KEY (Knowledge API key)",
        ),
      },
      { status: 503 },
    );
  }

  const baseUrl =
    process.env.DIFY_API_URL?.trim() || "https://api.dify.ai/v1";

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json(
      { error: withErrorOrigin(ErrorOrigin.serverParseRequest, "อ่าน multipart ไม่ได้") },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json(
      {
        error: withErrorOrigin(
          ErrorOrigin.serverParseRequest,
          'ต้องส่งฟิลด์ฟอร์มชื่อ "file"',
        ),
      },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return Response.json(
      {
        error: withErrorOrigin(
          ErrorOrigin.serverParseRequest,
          `ไฟล์ใหญ่เกิน ${Math.round(MAX_BYTES / (1024 * 1024))} MB`,
        ),
      },
      { status: 413 },
    );
  }

  try {
    const knowledge = await createKnowledgeDocumentFromFile({
      datasetApiKey,
      baseUrl,
      datasetId,
      blob: file,
      filename: file.name || "upload.bin",
    });
    return Response.json({
      documentId: knowledge.documentId,
      batch: knowledge.batch,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "อัปโหลดเข้า Knowledge ไม่สำเร็จ";
    return Response.json(
      { error: withErrorOrigin(ErrorOrigin.serverRouteCatch, msg) },
      { status: 502 },
    );
  }
}
