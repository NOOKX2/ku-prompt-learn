export const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-black outline-none transition placeholder:text-neutral-400 focus:border-brand focus:ring-2 focus:ring-[var(--brand-ring)]";

export const TEXT_IMPORT_ACCEPT =
  ".txt,.md,.csv,.json,.log,.tex,text/plain,text/markdown,text/csv,application/json";

/** ต้องแยก MIME ชัด — ห้ามรวมเป็น application/json/pdf (เบราว์เซอร์จะไม่จับคู่ PDF) */
export const PDF_ACCEPT = ".pdf,application/pdf";

export const UNIFIED_FILE_ACCEPT = `${TEXT_IMPORT_ACCEPT},${PDF_ACCEPT}`;

export const MAX_TEXT_IMPORT_BYTES = 1024 * 1024;
export const MAX_ATTACH_BYTES = 15 * 1024 * 1024;
export const MAX_ATTACH_PER_FIELD = 15;

/** จำกัดความยาวข้อความที่ดึงจาก PDF ต่อไฟล์ (ป้องกัน prompt ใหญ่เกินไป) */
export const MAX_PDF_EXTRACT_CHARS = 180_000;
/** ถ้าดึงได้สั้นกว่านี้ ถือว่าไม่มีเนื้อหาใช้ได้ — ยังเก็บชื่อไฟล์สำหรับ hint RAG */
export const MIN_PDF_EXTRACTED_CHARS = 50;
