import {
  ErrorOrigin,
  withErrorOrigin,
} from "@/lib/dify-errors";
import { createKnowledgeDocumentFromFile } from "@/lib/dify/knowledge-upload";
import { uploadBlobToDify } from "@/lib/dify/upload-remote";

export const runtime = "nodejs";

const MAX_BYTES = 15 * 1024 * 1024;

/** อัปโหลดไฟล์เดียวไป Dify — คืน { id } สำหรับส่งต่อใน workflowFiles ตอน /api/generate */
export async function POST(req: Request) {
  const reqId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
  const apiKey = process.env.DIFY_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      {
        error: withErrorOrigin(
          ErrorOrigin.serverConfig,
          "ยังไม่ได้ตั้งค่า DIFY_API_KEY",
        ),
      },
      { status: 503 },
    );
  }

  const baseUrl =
    process.env.DIFY_API_URL?.trim() || "https://api.dify.ai/v1";
  const user = process.env.DIFY_USER?.trim() || "ku-prompt-learn";

  console.log("[api/dify-upload]", {
    reqId,
    baseUrl,
    user,
    hasApiKey: Boolean(apiKey),
  });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    console.error("[api/dify-upload]", { reqId, message: "อ่าน multipart ไม่ได้" });
    return Response.json(
      { error: withErrorOrigin(ErrorOrigin.serverParseRequest, "อ่าน multipart ไม่ได้") },
      { status: 400 },
    );
  }

  const file = form.get("file");
  console.log("[api/dify-upload] received file", {
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

  const datasetId = process.env.DIFY_DATASET_ID?.trim();
  const datasetApiKey = process.env.DIFY_DATASET_API_KEY?.trim();
  const knowledgeConfigured = Boolean(datasetId && datasetApiKey);
  console.log("[api/dify-upload] knowledge config", {
    reqId,
    knowledgeConfigured,
    datasetId: datasetId ? "(set)" : undefined,
  });

  try {
    console.log("[api/dify-upload] uploading to Dify", { reqId, fileName: file.name });
    const fileRefPromise = uploadBlobToDify({
      apiKey,
      baseUrl,
      blob: file,
      filename: file.name || "upload.bin",
      user,
    });

    const knowledgePromise = knowledgeConfigured
      ? createKnowledgeDocumentFromFile({
          datasetApiKey: datasetApiKey!,
          baseUrl,
          datasetId: datasetId!,
          blob: file,
          filename: file.name || "upload.bin",
        })
      : null;

    const [ref, knowledge] = await Promise.all([
      fileRefPromise,
      knowledgePromise ?? Promise.resolve(null),
    ]);

    console.log("[api/dify-upload] uploaded", {
      reqId,
      uploadFileId: ref.upload_file_id,
      type: ref.type,
      transferMethod: ref.transfer_method,
      knowledgeCreated: Boolean(knowledge),
      knowledgeDocumentId: knowledge?.documentId,
      knowledgeBatch: knowledge?.batch,
    });

    return Response.json({
      id: ref.upload_file_id,
      type: ref.type,
      transfer_method: ref.transfer_method,
      knowledge: knowledge
        ? {
            documentId: knowledge.documentId,
            batch: knowledge.batch,
          }
        : null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ";
    console.error("[api/dify-upload] failed", { reqId, msg, err: e });
    return Response.json(
      { error: withErrorOrigin(ErrorOrigin.serverRouteCatch, msg) },
      { status: 502 },
    );
  }
}
