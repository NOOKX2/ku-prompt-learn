export const runtime = "nodejs";

/**
 * ค่าสำหรับฝั่ง client โดยไม่รั่วความลับ
 * - ตั้ง `DIFY_PDF_HANDLING=upload` เพื่อส่ง PDF ไป Dify แล้วใส่ workflowFiles (ให้ workflow รับไฟล์ + RAG ใน Dify)
 * - ค่าเริ่มต้น extract = ดึงข้อความในเบราว์เซอร์ — ถ้ามี `DIFY_DATASET_ID` + `DIFY_DATASET_API_KEY` จะอัปโหลด PDF เข้า Knowledge หลังดึงข้อความ (`/api/dify-knowledge-upload`)
 */
export async function GET() {
  const ex = process.env.DIFY_PDF_HANDLING?.trim().toLowerCase();
  const pdfHandling = ex === "upload" ? "upload" : "extract";

  const ds = process.env.DIFY_DATASET_ID?.trim();
  const dk = process.env.DIFY_DATASET_API_KEY?.trim();
  const knowledgeUploadEnabled = Boolean(ds && dk);

  return Response.json(
    { pdfHandling, knowledgeUploadEnabled },
    { headers: { "Cache-Control": "no-store" } },
  );
}
