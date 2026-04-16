export type ReviewPlanSession = {
  timeRange?: string;
  topics?: string[];
  reviewQuestions?: string[];
};

export type ReviewPlanDay = {
  dayIndex?: number;
  label?: string;
  date?: string | null;
  sessions?: ReviewPlanSession[];
  dailyChecklist?: string[];
};

export type ReviewPlan = {
  /** ตาม requirement: id = ตารางอ่านหนังสือ */
  id: "ตารางอ่านหนังสือ";
  planVersion: "1";
  title: string;
  subject: string;
  examDate: string;
  hoursPerDay?: string;
  weak?: string;
  syllabus?: string;
  schedule: ReviewPlanDay[];
  reviewChecklist: string[];
};

export type ParseReviewPlanResult =
  | { ok: true; plan: ReviewPlan }
  | { ok: false; error: string };

type JsonValue = null | boolean | number | string | JsonValue[] | { [k: string]: JsonValue };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function relaxTrailingCommas(json: string): string {
  let s = json;
  let prev = "";
  while (prev !== s) {
    prev = s;
    s = s.replace(/,(\s*[\]}])/g, "$1");
  }
  return s;
}

function sliceBalancedObject(s: string, startIdx: number): string | null {
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = startIdx; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (depth === 0) return s.slice(startIdx, i + 1);
  }
  return null;
}

function extractJsonCandidates(raw: string): string[] {
  const candidates = new Set<string>();

  // ```json ... ```
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/gi);
  if (fenced) {
    for (const block of fenced) {
      // strip fences
      const cleaned = block.replace(/```(?:json)?/i, "").replace(/```$/i, "").trim();
      if (cleaned.startsWith("{")) candidates.add(cleaned);
    }
  }

  const start = raw.indexOf("{");
  if (start !== -1) {
    const balanced = sliceBalancedObject(raw, start);
    if (balanced) candidates.add(balanced);
  }

  return Array.from(candidates);
}

function tryParseJson(s: string): unknown | null {
  try {
    return JSON.parse(s) as unknown;
  } catch {
    try {
      return JSON.parse(relaxTrailingCommas(s)) as unknown;
    } catch {
      return null;
    }
  }
}

function normalizeStoredPlan(raw: unknown): unknown {
  if (!isObject(raw)) return raw;
  const o = { ...raw } as Record<string, unknown>;

  // Normalize required identifiers
  const pv = o.planVersion;
  if (pv === 1 || pv === 1.0) o.planVersion = "1";
  if (typeof pv === "string") o.planVersion = pv.trim() === "1" ? "1" : pv;
  if (o.planVersion == null || o.planVersion === "") o.planVersion = "1";

  // ถ้าโมเดลลืมใส่ id ตาม requirement ให้เติมค่าให้เลยเพื่อให้บันทึกได้
  if (o.id == null || o.id === "") o.id = "ตารางอ่านหนังสือ";

  // Ensure arrays
  if (!Array.isArray(o.schedule)) o.schedule = [];
  if (!isStringArray(o.reviewChecklist)) o.reviewChecklist = [];

  // Coerce main strings (ทำให้ parse สำเร็จง่ายขึ้น)
  if (!isString(o.title)) o.title = "";
  if (!isString(o.subject)) o.subject = "";
  if (!isString(o.examDate)) o.examDate = "";

  return o;
}

function isReviewPlan(v: unknown): v is ReviewPlan {
  if (!isObject(v)) return false;
  const id = v.id;
  if (id !== "ตารางอ่านหนังสือ") return false;
  if (v.planVersion !== "1") return false;
  if (!isString(v.title)) return false;
  if (!isString(v.subject)) return false;
  if (!isString(v.examDate)) return false;
  if (!Array.isArray(v.schedule)) return false;
  if (!isStringArray(v.reviewChecklist)) return false;

  return true;
}

export function coerceStoredReviewPlan(raw: unknown): ReviewPlan | null {
  const normalized = normalizeStoredPlan(raw);
  return isReviewPlan(normalized) ? normalized : null;
}

export function parseReviewPlanJson(raw: string): ParseReviewPlanResult {
  const cands = extractJsonCandidates(raw);
  if (cands.length === 0) {
    return { ok: false, error: "ไม่พบ JSON สำหรับตารางทบทวนบทเรียนในข้อความ" };
  }

  for (const cand of cands) {
    const parsed = tryParseJson(cand);
    if (parsed == null) continue;
    const normalized = normalizeStoredPlan(parsed);
    if (isReviewPlan(normalized)) {
      return { ok: true, plan: normalized };
    }
  }

  const first = tryParseJson(cands[0] ?? "");
  if (first != null && isObject(first)) {
    return {
      ok: false,
      error:
        "โครงสร้าง JSON ของตารางทบทวนบทเรียนไม่ตรง schema (ต้องมี id='ตารางอ่านหนังสือ', planVersion='1', schedule[], reviewChecklist[])",
    };
  }

  return { ok: false, error: "JSON ไม่ถูกต้อง (parse ไม่ได้) — ลองให้ Dify ส่ง JSON เดียวหรือห่อด้วย ```json" };
}

