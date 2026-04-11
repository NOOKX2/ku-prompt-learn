/**
 * ตรวจว่าคำตอบจากโมเดลดูเหมือน «สะท้อนคำสั่ง» กลับมา (มักเกิดเมื่อ workflow ต่อ output กับตัวแปร query โดยตรง)
 */
/**
 * สตรีมส่งกลับแค่ค่า DIFY_USER เริ่มต้น — ไม่ใช่ข้อความจาก LLM (ตรวจเฉพาะค่า default ของแอป)
 */
export function isLikelyDifyUserPlaceholder(modelAnswer: string): boolean {
  const a = modelAnswer.trim();
  if (!a) return false;
  if (a.includes("{") || a.startsWith("```")) return false;
  return a.toLowerCase() === "ku-prompt-learn";
}

export function isLikelyPromptEcho(sentPrompt: string, modelAnswer: string): boolean {
  const s = sentPrompt.trim();
  const a = modelAnswer.trim();
  if (s.length < 60 || a.length < 60) return false;
  const head = s.slice(0, Math.min(280, s.length));
  if (a.startsWith(head)) return true;
  if (a.includes(head) && a.length >= s.length * 0.85) return true;
  return false;
}
