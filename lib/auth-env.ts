/** ใช้ในฝั่งเซิร์ฟเวอร์เท่านั้น — ควบคู่กับ Google provider ใน auth.ts */
export function isGoogleOAuthConfigured(): boolean {
  return (
    Boolean(process.env.GOOGLE_CLIENT_ID?.trim()) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim())
  );
}
