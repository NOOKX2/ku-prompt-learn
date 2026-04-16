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
  const reqId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
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

  console.log("[api/dify-knowledge-upload]", {
    reqId,
    baseUrl,
    datasetId: datasetId ? "(set)" : undefined,
  });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    console.error("[api/dify-knowledge-upload]", { reqId, message: "อ่าน multipart ไม่ได้" });
    return Response.json(
      { error: withErrorOrigin(ErrorOrigin.serverParseRequest, "อ่าน multipart ไม่ได้") },
      { status: 400 },
    );
  }

  const file = form.get("file");
  console.log("[api/dify-knowledge-upload] received file", {
    reqId,
    ok: file instanceof File,
    fileName: file instanceof File ? file.name : undefined,
    sizeBytes: file instanceof File ? file.size : undefined,
    mimeType: file instanceof File ? file.type : undefined,
  });

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
    console.log("[api/dify-knowledge-upload] uploading to Knowledge", {
      reqId,
      fileName: file.name,
    });
    const knowledge = await createKnowledgeDocumentFromFile({
      datasetApiKey,
      baseUrl,
      datasetId,
      blob: file,
      filename: file.name || "upload.bin",
    });
    console.log("[api/dify-knowledge-upload] uploaded", {
      reqId,
      documentId: knowledge.documentId,
      batch: knowledge.batch,
    });
    return Response.json({
      documentId: knowledge.documentId,
      batch: knowledge.batch,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "อัปโหลดเข้า Knowledge ไม่สำเร็จ";
    console.error("[api/dify-knowledge-upload] failed", { reqId, msg, err: e });
    return Response.json(
      { error: withErrorOrigin(ErrorOrigin.serverRouteCatch, msg) },
      { status: 502 },
    );
  }
}
