export type ImportSlot = {
  id: string;
  fieldKey: string;
  fileName: string;
  sizeBytes: number;
  kind: "text" | "pdf-embedded" | "pdf-rag" | "pdf-dify-upload";
  /** อัปโหลดไป Dify แล้ว — ส่งเป็น workflowFiles ตอนรัน */
  uploadFileId?: string;
  /** อ้างอิงเดียวกับรายการใน fieldAttachments สำหรับลบ */
  ragFile?: File;
};

/** ลบบล็อก [[KU_IMPORT:…]] แบบเก่าที่เคยต่อใน textarea (ย้ายไปเก็บแยกแล้ว) */
export function stripAllKuImportBlocks(text: string): string {
  if (!text.includes("[[KU_IMPORT:")) return text;
  return text
    .replace(/\n?\[\[KU_IMPORT:[^\]]+\]\][\s\S]*?\[\[\/KU_IMPORT:[^\]]+\]\]\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\n+/, "")
    .trimEnd();
}
