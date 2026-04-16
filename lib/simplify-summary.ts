export type SimplifyExplanationStep = {
  title: string;
  detail: string;
  example?: string;
};

export type SimplifyKeyword = {
  term: string;
  definition: string;
};

export type SimplifySummary = {
  summaryVersion: "1";
  topic: string;
  tone: string;
  length: string;
  corePoints: string[];
  explanationSteps: SimplifyExplanationStep[];
  examConnection: string;
  keywords: SimplifyKeyword[];
  needsMoreInfo: boolean;
  missingInfo: string[];
};

export type ParseSimplifySummaryResult =
  | { ok: true; summary: SimplifySummary }
  | { ok: false; error: string };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function isExplanationStep(v: unknown): v is SimplifyExplanationStep {
  if (!isObject(v)) return false;
  if (typeof v.title !== "string" || typeof v.detail !== "string") return false;
  return v.example == null || typeof v.example === "string";
}

function isKeyword(v: unknown): v is SimplifyKeyword {
  if (!isObject(v)) return false;
  return typeof v.term === "string" && typeof v.definition === "string";
}

function isSimplifySummary(v: unknown): v is SimplifySummary {
  if (!isObject(v)) return false;
  if (v.summaryVersion !== "1") return false;
  if (typeof v.topic !== "string") return false;
  if (typeof v.tone !== "string") return false;
  if (typeof v.length !== "string") return false;
  if (!isStringArray(v.corePoints)) return false;
  if (!Array.isArray(v.explanationSteps) || !v.explanationSteps.every(isExplanationStep)) return false;
  if (typeof v.examConnection !== "string") return false;
  if (!Array.isArray(v.keywords) || !v.keywords.every(isKeyword)) return false;
  if (typeof v.needsMoreInfo !== "boolean") return false;
  if (!isStringArray(v.missingInfo)) return false;
  return true;
}

/** ลบ trailing comma ก่อน } หรือ ] (กรณีโมเดลส่ง JSON หลวม) */
function relaxTrailingCommas(json: string): string {
  let s = json;
  let prev = "";
  while (prev !== s) {
    prev = s;
    s = s.replace(/,(\s*[\]}])/g, "$1");
  }
  return s;
}

function findMatchingBrace(s: string): number | null {
  const start = s.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\" && inString) {
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (c === "{") depth++;
    if (c === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return null;
}

function sliceBalancedObject(text: string, startIdx: number): string | null {
  const slice = text.slice(startIdx);
  const end = findMatchingBrace(slice);
  if (end === null) return null;
  return slice.slice(0, end + 1);
}

function pushUnique(candidates: string[], s: string) {
  const t = s.trim();
  if (t.length > 0 && !candidates.includes(t)) candidates.push(t);
}

function pushObjectsAroundKey(candidates: string[], text: string, keyNeedle: string) {
  let from = 0;
  while (from < text.length) {
    const pos = text.indexOf(keyNeedle, from);
    if (pos === -1) break;
    for (let i = pos - 1; i >= 0; i--) {
      if (text[i] === "{") {
        const s = sliceBalancedObject(text, i);
        if (s && s.includes(keyNeedle)) pushUnique(candidates, s);
      }
    }
    from = pos + 1;
  }
}

function stripInvisible(s: string): string {
  return s.replace(/[\u200B-\u200D\uFEFF]/g, "");
}

/**
 * ดึงก้อน JSON สรุปจากข้อความเต็ม — รองรับข้อความนำหน้า, ```json```, JSON ซ้ำต่อกัน, trailing comma
 */
function extractSummaryJsonCandidates(raw: string): string[] {
  let trimmed = raw.replace(/^\uFEFF/, "").trim();
  trimmed = stripInvisible(trimmed);
  if (!trimmed) return [];

  const candidates: string[] = [];

  const fenceRe = /```(?:json)?\s*([\s\S]*?)```/gi;
  let fm: RegExpExecArray | null;
  while ((fm = fenceRe.exec(trimmed)) !== null) {
    let inner = (fm[1] ?? "").trim();
    const lb = inner.indexOf("{");
    if (lb === -1) continue;
    inner = inner.slice(lb);
    const end = findMatchingBrace(inner);
    const chunk = end !== null ? inner.slice(0, end + 1) : inner;
    pushUnique(candidates, chunk);
  }

  pushObjectsAroundKey(candidates, trimmed, '"summaryVersion"');
  pushObjectsAroundKey(candidates, trimmed, "'summaryVersion'");
  pushObjectsAroundKey(candidates, trimmed, '"topic"');

  const anyBrace = trimmed.indexOf("{");
  if (anyBrace !== -1) {
    const s = sliceBalancedObject(trimmed, anyBrace);
    if (s) pushUnique(candidates, s);
  }

  if (trimmed.startsWith("{")) {
    pushUnique(candidates, trimmed);
  }

  return candidates;
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

/** รับค่า summaryVersion แบบตัวเลข / สตริง และเติมค่าเริ่มต้นให้ฟิลด์ที่โมเดลมักลืม */
function normalizeSummaryShape(raw: unknown): unknown {
  if (!isObject(raw)) return raw;
  const o = { ...raw };

  const sv = o.summaryVersion;
  if (sv === 1 || sv === 1.0) o.summaryVersion = "1";
  if (typeof sv === "string") {
    const t = sv.trim();
    if (t === "1" || t === "1.0") o.summaryVersion = "1";
  }

  if (!Array.isArray(o.corePoints)) o.corePoints = [];
  if (!Array.isArray(o.explanationSteps)) o.explanationSteps = [];
  if (!Array.isArray(o.keywords)) o.keywords = [];
  if (!Array.isArray(o.missingInfo)) o.missingInfo = [];

  if (typeof o.needsMoreInfo !== "boolean") {
    o.needsMoreInfo = Boolean(o.needsMoreInfo);
  }

  return o;
}

/** JSON จากคอลัมน์ `content` — normalize แล้วเช็คว่าเป็นสรุปเวอร์ชัน 1 */
export function coerceStoredSimplifySummary(raw: unknown): SimplifySummary | null {
  const n = normalizeSummaryShape(raw);
  return isSimplifySummary(n) ? n : null;
}

export function parseSimplifySummaryJson(raw: string): ParseSimplifySummaryResult {
  const cands = extractSummaryJsonCandidates(raw);
  if (cands.length === 0) {
    return { ok: false, error: "ไม่พบ JSON สำหรับสรุปในก้อนข้อความ" };
  }

  for (const candidate of cands) {
    const parsed = tryParseJson(candidate);
    if (parsed == null) continue;

    const normalized = normalizeSummaryShape(parsed);
    if (!isSimplifySummary(normalized)) continue;

    return { ok: true, summary: normalized };
  }

  const firstTry = tryParseJson(cands[0] ?? "");
  if (firstTry != null && isObject(firstTry)) {
    return {
      ok: false,
      error:
        "โครงสร้างสรุปไม่ตรง schema (summaryVersion, topic, corePoints, explanationSteps, keywords, needsMoreInfo, missingInfo) — หรือโมเดลส่งฟิลด์ไม่ครบ",
    };
  }

  return { ok: false, error: "JSON ไม่ถูกต้อง (parse ไม่ได้) — ลองให้โมเดลตอบเป็น JSON เดียวหรือห่อด้วย ```json" };
}
