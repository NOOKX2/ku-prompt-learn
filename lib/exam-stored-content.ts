import {
  isExamBundle,
  parseExamJson,
  type ExamBundle,
  type ParseExamResult,
} from "@/lib/exam-json";

/** โครงสร้างที่บันทึกใน `Exam.content` — raw จาก Dify + ชุดที่ parse ได้ (ถ้ามี) */
export type ExamStoredContent = {
  rawAnswer: string;
  exam?: ExamBundle;
};

export function buildExamStoredContent(rawAnswer: string, exam?: ExamBundle): ExamStoredContent {
  return exam ? { rawAnswer, exam } : { rawAnswer };
}

export function resolveExamFromContent(content: unknown): ParseExamResult {
  if (!content || typeof content !== "object") {
    return { ok: false, error: "ไม่มีข้อมูลข้อสอบ" };
  }
  const c = content as Record<string, unknown>;
  if (isExamBundle(c.exam)) {
    return { ok: true, exam: c.exam };
  }
  if (typeof c.rawAnswer === "string") {
    return parseExamJson(c.rawAnswer);
  }
  return { ok: false, error: "ไม่พบ rawAnswer ในเนื้อหาที่บันทึก" };
}
