import { difyChatFileType, type DifyUploadedFileRef } from "@/lib/dify/types";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/** อัปโหลดไฟล์ไป Dify แล้วได้ id สำหรับใส่ใน workflow inputs (โหมด RAG/เอกสารใน Dify) */
export async function uploadBlobToDify(args: {
  apiKey: string;
  baseUrl: string;
  blob: Blob;
  filename: string;
  user: string;
}): Promise<DifyUploadedFileRef> {
  const { apiKey, baseUrl, blob, filename, user } = args;
  const form = new FormData();
  form.append("file", blob, filename);
  form.append("user", user);

  const res = await fetch(`${normalizeBaseUrl(baseUrl)}/files/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`อัปโหลดไฟล์ไป Dify ไม่สำเร็จ (${res.status}): ${raw.slice(0, 500)}`);
  }

  let data: { id?: string };
  try {
    data = JSON.parse(raw) as { id?: string };
  } catch {
    throw new Error("อัปโหลดไป Dify แล้วแต่อ่าน JSON ตอบกลับไม่ได้");
  }
  if (!data.id || typeof data.id !== "string") {
    throw new Error("อัปโหลดไป Dify แล้วแต่ไม่มี upload id ใน response");
  }

  const type = difyChatFileType(blob.type || "application/octet-stream", filename);
  return {
    type,
    transfer_method: "local_file",
    upload_file_id: data.id,
  };
}
