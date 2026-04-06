/** ข้อความช่วยตามรหัสที่ Dify ส่งกลับ */
const DIFY_HINTS_TH: Record<string, string> = {
  app_unavailable:
    "แก้ใน Dify: กด Publish แอป · ตั้ง Model Provider · ใช้ API key จากแอปนี้\n" +
    "ถ้าแอปเป็น Workflow (ไม่ใช่ Chat): ตั้ง DIFY_APP_MODE=workflow และ DIFY_PROMPT_INPUT_KEY ให้ตรงชื่อตัวแปรเริ่มต้นใน workflow\n" +
    "ทดสอบ: เปิด GET /api/generate",
  provider_not_initialize:
    "Dify → Settings → Model Provider ให้ใส่คีย์ผู้ให้บริการโมเดล",
  provider_quota_exceeded: "โควต้าโมเดลเต็ม — ตรวจ Model Provider ใน Dify",
  model_currently_not_support: "เปลี่ยนโมเดลในแอปให้รองรับ",
  completion_request_error: "ตรวจตัวแปร inputs ให้ตรงกับแอป",
  too_many_requests: "คำขอถี่เกินไป — รอแล้วลองใหม่",
};

export type DifyParsedError = {
  message: string;
  code?: string;
  hint?: string;
};

export function parseDifyErrorBody(bodyText: string): DifyParsedError {
  try {
    const j = JSON.parse(bodyText) as {
      message?: string;
      code?: string;
    };
    const message =
      typeof j.message === "string" && j.message.length > 0
        ? j.message
        : bodyText;
    const code = typeof j.code === "string" ? j.code : undefined;
    const hint = code ? DIFY_HINTS_TH[code] : undefined;
    return { message, code, hint };
  } catch {
    return { message: bodyText || "ข้อผิดพลาดจาก Dify" };
  }
}
