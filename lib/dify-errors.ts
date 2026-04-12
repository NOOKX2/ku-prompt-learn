/**
 * ใช้นำหน้าข้อความ error ให้รู้ว่าเกิดที่ขั้นไหน (แก้ proxy / Dify / โค้ดถูกจุด)
 */
export const ErrorOrigin = {
  /** env / การตั้งค่าเซิร์ฟเวอร์ */
  serverConfig: "เซิร์ฟเวอร์ → ตรวจ env (DIFY_API_KEY / DIFY_API_URL / DIFY_APP_MODE)",
  /** บราว์เซอร์เรียก Next API */
  clientFetchApiGenerate: "① เบราว์เซอร์ → fetch POST /api/generate",
  /** บราว์เซอร์อ่าน body สตรีม text/plain จากแอป */
  clientReadResponseStream: "② เบราว์เซอร์ → อ่านสตรีมคำตอบจากแอป",
  /** Route อ่าน JSON คำขอ */
  serverParseRequest: "③ เซิร์ฟเวอร์ → อ่านคำขอ (parseIncomingRequest)",
  /** Dify ตอบ HTTP 4xx/5xx ก่อนมีสตรีม */
  serverDifyHttpError: "④ เซิร์ฟเวอร์ → Dify ตอบ HTTP error (ยังไม่ใช่สตรีมคำตอบ)",
  /** fetch ไป Dify ล้ม (เครือข่าย, DNS, connection) */
  serverDifyFetchFailed: "④ เซิร์ฟเวอร์ → เรียก Dify API ไม่สำเร็จ (ก่อนได้ response)",
  /** transformDifyStream หรือ body ไม่ใช่สตรีม */
  serverStreamSetup: "⑤ เซิร์ฟเวอร์ → เตรียมสตรีม (transformDifyStream)",
  /** อ่าน SSE จาก Dify แล้วแปลงเป็นข้อความ — ถ้าถูกตัดบ่อยลอง DIFY_RESPONSE_MODE=blocking */
  serverSseParser:
    "⑥ เซิร์ฟเวอร์ → แปลง SSE จาก Dify (lib/dify/chat-stream) — socket ขาดให้ลอง .env DIFY_RESPONSE_MODE=blocking เมื่อเป็น workflow",
  /** event error ใน payload SSE จาก Dify */
  difySseEventError: "⑥′ สตรีม Dify → event: error",
  /** POST handler จับข้อยกเว้นที่ยังไม่มีป้ายต้นทาง */
  serverRouteCatch: "⑦ เซิร์ฟเวอร์ → /api/generate (ข้อยกเว้นทั่วไป)",
} as const;

export function withErrorOrigin(origin: string, message: string): string {
  return `[${origin}]\n${message.trim()}`;
}

/** fetch/read ถูกยกเลิกด้วย AbortController — ไม่ใช่เครือข่ายล้ม */
export function isAbortLike(e: unknown): boolean {
  if (e instanceof DOMException && e.name === "AbortError") return true;
  if (e instanceof Error && e.name === "AbortError") return true;
  return false;
}

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

/**
 * แปลงข้อความ error จาก fetch/read สตรีม (เช่น socket closed, ECONNRESET) เป็นข้อความที่อ่านได้
 */
export function explainStreamConnectionError(
  e: unknown,
  where?: string,
): string {
  const raw = e instanceof Error ? e.message : String(e);
  const lower = raw.toLowerCase();
  const isSocketOrReset =
    lower.includes("socket") ||
    lower.includes("closed unexpectedly") ||
    lower.includes("econnreset") ||
    lower.includes("connection reset") ||
    lower.includes("broken pipe") ||
    (lower.includes("network") && lower.includes("fail"));

  const whereLine = where ? `${where}\n` : "";

  if (isSocketOrReset) {
    const bunHint =
      /verbose:\s*true|bun/i.test(raw)
        ? "\nหมายเหตุ: ข้อความอ้าง Bun fetch — ถ้า SSE ขาดบ่อยลอง `DIFY_RESPONSE_MODE=blocking` (เฉพาะ workflow) หรือรัน `next dev` ด้วย Node แทน Bun"
        : "";
    return (
      whereLine +
      "การเชื่อมต่อถูกตัดก่อนจบ — มักเกิดจาก timeout, เครือข่าย, reverse proxy, หรือฝั่ง Dify ปิดการเชื่อมต่อ " +
      "(ลองใหม่ / ตรวจ proxy_read_timeout / โควตาโฮสต์ / workflow นานพิเศษลอง blocking — ดู DIFY_RESPONSE_MODE ใน .env)" +
      bunHint +
      (typeof process !== "undefined" && process.env?.NODE_ENV === "development"
        ? `\n(รายละเอียดเทคนิค: ${raw})`
        : "")
    );
  }
  return whereLine + raw;
}

/** ช่วยเมื่อ Dify บอกว่าขาดฟิลด์ไฟล์ใน inputs */
function supplementUploadFieldHint(message: string): string | undefined {
  const m = message.toLowerCase();
  if (
    !m.includes("upload") ||
    (!m.includes("required") && !m.includes("invalid_param"))
  ) {
    return undefined;
  }
  return (
    "แอปส่งแค่ข้อความ (prompt) จากฟอร์ม — ไม่มีอัปโหลดไฟล์ไป Dify\n" +
    "แก้ได้สามแบบ: (ก) ใน Dify ปลด Required ของฟิลด์ไฟล์ในแบบฟอร์มเริ่มต้น workflow\n" +
    "(ข) ใน .env ใส่ DIFY_INPUTS_JSON={\"upload_file\":[]} โดยชื่อคีย์ให้ตรงกับฟิลด์ใน Dify\n" +
    "(ค) หรือ DIFY_WORKFLOW_EMPTY_FILE_INPUT_KEYS=upload_file (คั่นหลายคีย์ด้วยจุลภาค) ให้แอปใส่ [] ให้อัตโนมัติ"
  );
}

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
    let hint = code ? DIFY_HINTS_TH[code] : undefined;
    const extra = supplementUploadFieldHint(message);
    if (extra) {
      hint = hint ? `${hint}\n\n${extra}` : extra;
    }
    return { message, code, hint };
  } catch {
    return { message: bodyText || "ข้อผิดพลาดจาก Dify" };
  }
}
