import type { PromptTemplate } from "@/lib/prompt-templates";

export function defaultValues(t: PromptTemplate): Record<string, string> {
  const o: Record<string, string> = {};
  for (const f of t.fields) {
    if (f.type === "select" && f.options?.length) o[f.key] = f.options[0].value;
    else if (t.id === "mock-exam" && f.key === "count") o[f.key] = "5";
    else o[f.key] = "";
  }
  return o;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function isTextImportFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  if (mime.startsWith("text/")) return true;
  if (mime === "application/json") return true;
  return /\.(txt|md|csv|json|log|tex)$/i.test(name);
}

export function isPdfFile(file: { type: string; name: string }): boolean {
  const n = file.name.toLowerCase();
  return file.type === "application/pdf" || n.endsWith(".pdf");
}

/** รวบรวมชื่อ PDF ที่แนบต่อช่อง — ส่งเป็นข้อความใน prompt (RAG อ่านจาก Knowledge ใน Dify) */
export function collectPdfAttachmentMeta(
  template: PromptTemplate,
  attached: Record<string, File[]>,
): { fieldKey: string; name: string }[] {
  const meta: { fieldKey: string; name: string }[] = [];
  for (const field of template.fields) {
    if (field.type !== "textarea") continue;
    for (const file of attached[field.key] ?? []) {
      if (isPdfFile(file)) meta.push({ fieldKey: field.key, name: file.name });
    }
  }
  return meta;
}

/** ต่อท้าย prompt ว่ามี PDF อะไร — ไม่ส่งไฟล์ไป API */
export function appendRagPdfReferenceHint(
  prompt: string,
  meta: { fieldKey: string; name: string }[],
): string {
  if (meta.length === 0) return prompt.trimEnd();
  const lines = meta.map((m) => `- ช่อง "${m.fieldKey}": ${m.name}`);
  return `${prompt.trimEnd()}\n\n## เอกสารอ้างอิงที่ผู้ใช้เลือก (ชื่อไฟล์ — ไม่มีข้อความดึงได้ในเครื่อง)\n${lines.join("\n")}\nให้ใช้เนื้อหาจาก Knowledge / RAG ใน Dify ที่ตรงกับชื่อไฟล์เหล่านี้ — แอปไม่ส่งไฟล์ binary ไป API\n`;
}

/**
 * เมื่อส่ง PDF ผ่าน Dify `files/upload` + workflow inputs — ข้อความใน prompt หลักมักมีแค่บรรทัดอ้างอิงสั้นๆ
 * โมเดลจึงเข้าใจผิดว่า "ไม่มีเนื้อหา" แม้ workflow จะส่งเอกสารเข้ามาในขั้นอื่น — ต่อท้ายคำสั่งให้ชัด
 */
export function appendDifyWorkflowUploadedPdfHint(
  prompt: string,
  fileNames: string[],
): string {
  if (fileNames.length === 0) return prompt.trimEnd();
  const list = fileNames.map((n) => `- ${n}`).join("\n");
  return `${prompt.trimEnd()}\n\n---\n## ไฟล์ PDF ที่ส่งผ่าน Dify (แอปอัปโหลดแล้ว)\nรายการชื่อไฟล์:\n${list}\n\n**คำสั่งสำคัญ:** ไฟล์เหล่านี้ถูกอัปโหลดไป Dify และถูกส่งเป็นอินพุตไฟล์ของ workflow (เช่น \`upload_file\`) แล้ว — **ให้ใช้เนื้อหาวิชาที่คุณได้รับจากการอ่าน/ประมวลผลไฟล์ใน workflow หรือจาก Knowledge ที่ workflow ดึงมา** เป็นฐานสร้างข้อสอบ\n- **ห้าม**ตัดสินว่า "ไม่มีเนื้อหา" เพียงเพราะช่อง «เนื้อหาอ้างอิง» ในฟอร์มสั้นหรือมีแต่ชื่อไฟล์ — ช่องนั้นไม่ได้ใส่ข้อความ PDF เต็มโดยออกแบบ\n- ถ้าคุณได้รับข้อความ/สรุปจากเอกสารจริงในบริบทจาก Dify แล้ว ให้ใช้เป็นหลักตามกฎ «ห้ามเดาเนื้อหาวิชา»\n- ถ้าคุณ **ไม่ได้รับ**เนื้อหาเอกสารจาก workflow เลย (มีแต่ข้อความนี้) จึงค่อยตอบตามกฎขาดข้อมูล และแนะนำให้ตรวจว่า workflow โหนดอ่านเอกสาร/ดึง Knowledge ส่งเข้าโมเดลหรือยัง\n`;
}

/** ช่อง textarea หลักที่รวมนำเข้าข้อความ (จุดเดียวในฟอร์ม) */
export function primaryAttachmentFieldKey(template: PromptTemplate): string | null {
  const textareas = template.fields.filter((f) => f.type === "textarea");
  if (textareas.length === 0) return null;
  const prefer = ["material", "content", "syllabus", "chapters", "focus"];
  for (const k of prefer) {
    if (textareas.some((f) => f.key === k)) return k;
  }
  return textareas[0].key;
}

export function readFileAsUtf8Text(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.readAsText(file, "UTF-8");
  });
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      reader.result instanceof ArrayBuffer ? resolve(reader.result) : reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.readAsArrayBuffer(file);
  });
}
