/** ชนิดไฟล์ตาม Chat / Messages API ของ Dify */
export function difyChatFileType(
  mime: string,
  filename: string,
): "document" | "image" | "audio" | "video" | "custom" {
  const m = mime.toLowerCase();
  const n = filename.toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("audio/")) return "audio";
  if (m.startsWith("video/")) return "video";
  if (m === "application/pdf" || n.endsWith(".pdf")) return "document";
  if (
    m.includes("word") ||
    n.endsWith(".doc") ||
    n.endsWith(".docx") ||
    m.includes("spreadsheet") ||
    n.endsWith(".xls") ||
    n.endsWith(".xlsx") ||
    m.includes("presentation") ||
    n.endsWith(".ppt") ||
    n.endsWith(".pptx") ||
    m === "text/plain" ||
    m === "text/markdown" ||
    n.endsWith(".txt") ||
    n.endsWith(".md")
  ) {
    return "document";
  }
  return "document";
}

export type DifyUploadedFileRef = {
  type: ReturnType<typeof difyChatFileType>;
  transfer_method: "local_file";
  upload_file_id: string;
};
