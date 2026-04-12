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

  const datasetId = process.env.DIFY_DATASET_ID?.trim();
  const datasetApiKey = process.env.DIFY_DATASET_API_KEY?.trim();
  const knowledgeConfigured = Boolean(datasetId && datasetApiKey);

  try {
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
    return Response.json(
      { error: withErrorOrigin(ErrorOrigin.serverRouteCatch, msg) },
      { status: 502 },
    );
  }
}
