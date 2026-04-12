/**
 * Workflow บางชุดส่ง outputs เป็น object ล้วน (เช่น JSON ข้อสอบ) ไม่มีฟิลด์สตริงแบบ text/answer
 * — ใช้กับ blocking body และ SSE workflow_finished / node_finished
 */
export function stringifyWorkflowOutputFallback(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    return t.length > 0 ? t : null;
  }
  if (typeof v === "object") {
    try {
      const s = JSON.stringify(v);
      const t = s.trim();
      if (t.length >= 18 && t !== "{}" && t !== "[]") return t;
    } catch {
      return null;
    }
  }
  return null;
}
