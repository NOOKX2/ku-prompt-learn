import { difyChatFileType } from "@/lib/dify/types";

export function isImageFileForOcr(mime: string, filename: string): boolean {
  return difyChatFileType(mime, filename) === "image";
}

/**
 * เคยมี OCR ผ่าน tesseract.js แต่ถูกถอดออก — แพ็กเกจนั้นทำให้ Next/Turbopack หรือบาง CI
 * build ไม่ผ่าน (Can't resolve 'tesseract.js') แม้ติดตั้งแล้ว
 *
 * รูปแนบยังถูกอัปโหลดไป Dify ตามเดิม — ให้ตั้ง workflow ให้โมเดลรับภาพ (vision) หรือพิมพ์ข้อความในช่องอ้างอิง
 */
export async function buildImageOcrAppendix(
  _blobs: File[],
  _nameAt: (index: number) => string,
): Promise<string> {
  return "";
}
