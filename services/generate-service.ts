/**
 * เรียก `/api/generate` จากเบราว์เซอร์ — ใช้ `generate-client` (มี console.error ตามขั้นเมื่อล้ม)
 */
export { streamGenerate, type StreamGenerateArgs } from "@/services/generate-client";
