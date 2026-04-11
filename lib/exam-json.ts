/**
 * รูปแบบ JSON ข้อสอบสำหรับหน้าเว็บ — สอดคล้องกับคำสั่งในเทมเพลต mock-exam
 */

export const EXAM_JSON_STORAGE_KEY = "ku-prompt-learn-exam-json";

export type ExamMcqChoice = { id: string; label: string };

export type ExamMcqQuestion = {
  id: string;
  type: "mcq";
  prompt: string;
  choices: ExamMcqChoice[];
  /** ใช้ตรวจคำตอบ / แสดงเฉลย */
  correctChoiceId: string;
};

export type ExamEssayQuestion = {
  id: string;
  type: "essay";
  prompt: string;
  maxScore?: number;
  rubricHint?: string;
  modelAnswer?: string;
};

export type ExamAnswerKey = {
  mcq: Record<string, string>;
  essayNotes?: Record<string, string>;
};

export type ExamBundle = {
  examVersion: "1";
  title: string;
  subject?: string;
  difficulty?: string;
  instructions?: string;
  mcq: ExamMcqQuestion[];
  essay: ExamEssayQuestion[];
  answerKey?: ExamAnswerKey;
};

/** จับชุด `{ ... "examVersion" ... }` เฉพาะเมื่อ `examVersion` อยู่หลัง `{` ทันที — ใช้ร่วมกับการค้นหาแบบย้อนหา */
const EXAM_JSON_START = /\{\s*"examVersion"\s*:/;

function normalizeJsonishQuotes(s: string): string {
  return s
    .replace(/[\u201C\u201D\u00AB\u00BB]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
}

/** วงเล็บปีกกาแบบ fullwidth ที่บางโมเดล/ระบบส่งมา */
function normalizeAsciiBraces(s: string): string {
  return s.replace(/\uFF5B/g, "{").replace(/\uFF5D/g, "}");
}

function stripInvisible(s: string): string {
  return s.replace(/[\u200B-\u200D\uFEFF]/g, "");
}

function decodeBasicHtmlEntities(s: string): string {
  if (!s.includes("&")) return s;
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/** คำตอบเป็น JSON string หุ้มชั้นเดียวหรือซ้อน (มี \\\" ภายใน) */
function unwrapOuterJsonString(s: string): string {
  let out = s;
  for (let n = 0; n < 4; n++) {
    const t = out.trim();
    if (t.length < 4) break;
    const q = t[0];
    if ((q !== '"' && q !== "'") || t[t.length - 1] !== q) break;
    try {
      const inner = JSON.parse(t) as unknown;
      if (typeof inner === "string" && (inner.includes("{") || /examVersion/i.test(inner))) {
        out = inner;
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  return out;
}

/** ตัดข้อความก่อน `{` แรก (เช่น user id ต่อ ```json โดยไม่ขึ้นบรรทัดใหม่) */
function stripToFirstBraceObject(s: string): string {
  const i = s.indexOf("{");
  if (i <= 0) return s;
  return s.slice(i);
}

function prepareAnswerText(raw: string): string {
  let s = raw.replace(/^\uFEFF/, "").trim();
  s = stripInvisible(s);
  s = decodeBasicHtmlEntities(s);
  s = normalizeJsonishQuotes(s);
  s = normalizeAsciiBraces(s);
  s = unwrapOuterJsonString(s);
  s = stripToFirstBraceObject(s);
  return s;
}

/** รั้ว ``` เปิดแต่ไม่ปิด — ดึงตั้งแต่ { แรกถึงวงเล็บปิดที่ตรงคู่ */
function extractAfterOpeningCodeFence(text: string): string | null {
  const m = /```(?:json)?\s*\r?\n?/i.exec(text);
  if (!m || m.index === undefined) return null;
  const rest = text.slice(m.index + m[0].length);
  const lb = rest.indexOf("{");
  if (lb === -1) return null;
  const from = rest.slice(lb);
  const end = findMatchingBrace(from);
  return end !== null ? from.slice(0, end + 1) : null;
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

/**
 * โมเดลมักใส่ "title" / "subject" ก่อน "examVersion" — ต้องหา `{` ที่เปิดอ็อบเจ็กต์ที่มีคีย์นี้ ไม่ใช่แค่ {\n  "examVersion"
 */
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

/** คีย์ examVersion แบบใส่เครื่องหมายคำพูดเดี่ยวหรือคู่ */
function pushObjectsAroundExamVersionFlexible(candidates: string[], text: string) {
  const re = /["']examVersion["']\s*:/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const pos = m.index;
    for (let i = pos - 1; i >= 0; i--) {
      if (text[i] === "{") {
        const s = sliceBalancedObject(text, i);
        if (s && /examVersion/i.test(s)) pushUnique(candidates, s);
      }
    }
  }
}

/**
 * ดึงสตริง JSON ชุดข้อสอบจากคำตอบโมเดล — รองรับหลายบล็อก ```, ข้อความนำหน้า, หรือ JSON ที่ไม่ได้ห่อรั้ว
 */
export function extractJsonCandidate(text: string): string | null {
  let trimmed = prepareAnswerText(text);
  if (!trimmed) return null;

  /* บางระบบส่งก้อนเป็น escaped string โดยไม่มี { จนกว่าจะถอด \\ */
  if (!trimmed.includes("{") && /\\["']/.test(trimmed)) {
    const unesc = trimmed.replace(/\\"/g, '"').replace(/\\'/g, "'");
    if (unesc.includes("{")) trimmed = unesc;
  }

  const candidates: string[] = [];

  // 0) รั้ว ``` เปิดแต่ไม่ปิด / มีแค่ ```json แล้วต่อด้วย {
  const unclosedFence = extractAfterOpeningCodeFence(trimmed);
  if (unclosedFence) pushUnique(candidates, unclosedFence);

  // 1) ทุกบล็อก ```json ... ``` / ``` ... ``` (วนทั้งเอกสาร — ไม่ใช่แค่บล็อกแรก)
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

  // 2) อ็อบเจ็กต์ที่มี examVersion / mcq ไม่ว่าลำดับคีย์
  pushObjectsAroundKey(candidates, trimmed, '"examVersion"');
  pushObjectsAroundKey(candidates, trimmed, '"ExamVersion"');
  pushObjectsAroundKey(candidates, trimmed, '"exam_version"');
  pushObjectsAroundExamVersionFlexible(candidates, trimmed);
  pushObjectsAroundKey(candidates, trimmed, '"mcq":');

  // 3) กรณี examVersion อยู่หลัง { ทันที (เดิม)
  const examAt = EXAM_JSON_START.exec(trimmed);
  if (examAt && examAt.index !== undefined) {
    const s = sliceBalancedObject(trimmed, examAt.index);
    if (s) pushUnique(candidates, s);
  }

  // 4) แบบเก่า {"examVersion" ชิดกัน
  const legacy = trimmed.indexOf('{"examVersion"');
  if (legacy !== -1) {
    const s = sliceBalancedObject(trimmed, legacy);
    if (s) pushUnique(candidates, s);
  }

  // 5) { แรกในเอกสาร (สำรอง — อาจดึงผิดถ้ามี { ในข้อความธรรมดาก่อน JSON)
  const anyBrace = trimmed.indexOf("{");
  if (anyBrace !== -1) {
    const s = sliceBalancedObject(trimmed, anyBrace);
    if (s) pushUnique(candidates, s);
    else pushUnique(candidates, trimmed.slice(anyBrace));
  }

  const looksLikeExamShape = (o: Record<string, unknown>) => {
    if ("examVersion" in o || "exam_version" in o || "ExamVersion" in o) return true;
    if (typeof o.title === "string" && Array.isArray(o.mcq)) return true;
    return false;
  };

  for (const c of candidates) {
    try {
      const p = JSON.parse(c) as unknown;
      if (p && typeof p === "object" && looksLikeExamShape(p as Record<string, unknown>)) {
        return c;
      }
    } catch {
      try {
        const p = JSON.parse(relaxTrailingCommas(c)) as unknown;
        if (p && typeof p === "object" && looksLikeExamShape(p as Record<string, unknown>)) {
          return relaxTrailingCommas(c);
        }
      } catch {
        /* ลองชุดถัดไป */
      }
    }
  }

  /* สตรีมยังไม่ครบ / JSON หลวม — ส่งตัวแรกให้ parseExamJson ตัดสิน */
  if (candidates.length > 0) {
    const first = candidates[0];
    try {
      JSON.parse(first);
      return first;
    } catch {
      try {
        JSON.parse(relaxTrailingCommas(first));
        return relaxTrailingCommas(first);
      } catch {
        return first;
      }
    }
  }
  return null;
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

function isMcqChoice(x: unknown): x is ExamMcqChoice {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.label === "string";
}

function isMcqQuestion(x: unknown): x is ExamMcqQuestion {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (o.type !== "mcq") return false;
  if (typeof o.id !== "string" || typeof o.prompt !== "string") return false;
  if (typeof o.correctChoiceId !== "string") return false;
  if (!Array.isArray(o.choices) || o.choices.length < 2) return false;
  return o.choices.every(isMcqChoice);
}

function isEssayQuestion(x: unknown): x is ExamEssayQuestion {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (o.type !== "essay") return false;
  return typeof o.id === "string" && typeof o.prompt === "string";
}

/** โมเดลบางตัวส่ง examVersion เป็น 1 / "1.0" / snake_case — ขาด essay ใส่ [] */
function normalizeExamBundleShape(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const o = raw as Record<string, unknown>;
  const next = { ...o };
  if (next.examVersion === 1 || next.examVersion === 1.0) next.examVersion = "1";
  if (typeof next.examVersion === "string") {
    const t = next.examVersion.trim();
    if (t === "1" || t === "1.0") next.examVersion = "1";
  }
  if (next.examVersion == null && next.exam_version != null) {
    const ev = next.exam_version;
    next.examVersion =
      ev === 1 || ev === 1.0 || ev === "1" || ev === "1.0" ? "1" : String(ev);
    delete next.exam_version;
  }
  if (next.examVersion == null && next.ExamVersion != null) {
    const ev = next.ExamVersion;
    next.examVersion =
      ev === 1 || ev === 1.0 || ev === "1" || ev === "1.0" ? "1" : String(ev);
    delete next.ExamVersion;
  }
  if (!Array.isArray(next.mcq)) next.mcq = [];
  if (!Array.isArray(next.essay)) next.essay = [];
  return next;
}

export function isExamBundle(x: unknown): x is ExamBundle {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (o.examVersion !== "1") return false;
  if (typeof o.title !== "string") return false;
  if (!Array.isArray(o.mcq) || !o.mcq.every(isMcqQuestion)) return false;
  if (!Array.isArray(o.essay) || !o.essay.every(isEssayQuestion)) return false;
  return true;
}

export type ParseExamResult =
  | { ok: true; exam: ExamBundle }
  | { ok: false; error: string };

export function parseExamJson(raw: string): ParseExamResult {
  const candidate = extractJsonCandidate(raw);
  if (!candidate) {
    return {
      ok: false,
      error:
        "ไม่พบก้อน JSON ข้อสอบในก้อนข้อความ (ต้องมี { … } และคีย์ examVersion หรือ mcq) — ถ้ามีแล้วยังขึ้นแบบนี้ ให้ลองคัดลอก JSON ไปวางในช่องหรือห่อด้วย ```json",
    };
  }
  let parsed: unknown;
  try {
    parsed = normalizeExamBundleShape(JSON.parse(candidate) as unknown);
  } catch {
    try {
      parsed = normalizeExamBundleShape(JSON.parse(relaxTrailingCommas(candidate)) as unknown);
    } catch {
      return { ok: false, error: "JSON ไม่ถูกต้อง (parse ไม่ได้)" };
    }
  }
  if (!isExamBundle(parsed)) {
    return {
      ok: false,
      error:
        "โครงสร้าง JSON ไม่ตรงสคีมา — ต้องมี examVersion (รับ \"1\" หรือ \"1.0\"), title, mcq[] — essay ถ้าไม่มีจะใส่ [] ให้ — แต่ละข้อปรนัยต้องมี choices อย่างน้อย 2 ตัวเลือกและ correctChoiceId",
    };
  }
  return { ok: true, exam: parsed };
}
