import type { PromptTemplate } from "@/lib/prompt-templates";

export function defaultValues(t: PromptTemplate): Record<string, string> {
  const o: Record<string, string> = {};
  for (const f of t.fields) {
    if (f.type === "select" && f.options?.length) o[f.key] = f.options[0].value;
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

export function collectAttachmentsInFieldOrder(
  template: PromptTemplate,
  attached: Record<string, File[]>,
): { files: File[]; meta: { fieldKey: string; name: string }[] } {
  const files: File[] = [];
  const meta: { fieldKey: string; name: string }[] = [];
  for (const field of template.fields) {
    if (field.type !== "textarea") continue;
    for (const file of attached[field.key] ?? []) {
      files.push(file);
      meta.push({ fieldKey: field.key, name: file.name });
    }
  }
  return { files, meta };
}

/** ต่อท้าย prompt ที่ส่ง Dify — โมเดลมองไม่เห็นไฟล์ใน `File[]` โดยตรง จึงต้องบอกเป็นข้อความว่ามีไฟล์อะไรแนบ (โดยเฉพาะเมื่อแนบที่ช่องเช่น chapters แต่ไม่ได้พิมพ์ในช่อง) */
export function appendAttachmentNoticeToPrompt(
  prompt: string,
  meta: { fieldKey: string; name: string }[],
): string {
  if (meta.length === 0) return prompt;
  const lines = meta.map((m) => `- ช่อง "${m.fieldKey}": ${m.name}`);
  return `${prompt.trimEnd()}\n\n## ข้อมูลอ้างอิงที่แนบมากับคำขอนี้ (ส่งผ่าน API)\nไฟล์ต่อไปนี้ถูกส่งไปยังระบบแล้ว — ให้ถือเป็นแหล่งเนื้อหาที่อนุญาตให้ใช้ (ร่วมกับข้อความในฟอร์มถ้ามี):\n${lines.join("\n")}\n\nอย่าตอบว่าไม่มีไฟล์แนบหรือไม่มีเนื้อหาอ้างอิง หากมีรายการด้านบน — ให้อ่านและใช้เนื้อหาจากไฟล์เหล่านี้เป็นฐานสร้างคำตอบ\n`;
}

export function readFileAsUtf8Text(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.readAsText(file, "UTF-8");
  });
}
