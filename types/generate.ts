/** รูปแบบ JSON error จาก `/api/generate` เมื่อ !ok */
export type GenerateApiErrorJson = {
  error?: string;
  hint?: string;
  difyCode?: string;
};
