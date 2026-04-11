"use client";

import type { ExamBundle } from "@/lib/exam-json";

type Props = { exam: ExamBundle };

const PREVIEW_MCQ = 5;
const PREVIEW_ESSAY = 3;

export function ExamAnswerSummary({ exam }: Props) {
  const mcqShow = exam.mcq.slice(0, PREVIEW_MCQ);
  const mcqRest = Math.max(0, exam.mcq.length - PREVIEW_MCQ);
  const essayShow = exam.essay.slice(0, PREVIEW_ESSAY);
  const essayRest = Math.max(0, exam.essay.length - PREVIEW_ESSAY);

  return (
    <div className="space-y-4 border-b border-neutral-100 bg-linear-to-b from-brand-muted/30 to-white px-4 py-4 sm:px-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">สรุปชุดข้อสอบ (อ่านง่าย)</p>
        <h2 className="mt-1 text-lg font-semibold text-black">{exam.title}</h2>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-neutral-700">
          {exam.subject ? (
            <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-neutral-200">
              รายวิชา: {exam.subject}
            </span>
          ) : null}
          {exam.difficulty ? (
            <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-neutral-200">
              ระดับ: {exam.difficulty}
            </span>
          ) : null}
          <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-neutral-200">
            ปรนัย {exam.mcq.length} ข้อ
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-neutral-200">
            อัตนัย {exam.essay.length} ข้อ
          </span>
        </div>
        {exam.instructions ? (
          <p className="mt-3 text-sm leading-relaxed text-neutral-800">{exam.instructions}</p>
        ) : null}
      </div>

      {mcqShow.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-neutral-600">ตัวอย่างข้อปรนัย</p>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-neutral-900">
            {mcqShow.map((q, i) => (
              <li key={q.id} className="leading-relaxed">
                <span className="text-neutral-600">ข้อ {i + 1}</span> {q.prompt}
              </li>
            ))}
          </ol>
          {mcqRest > 0 ? (
            <p className="mt-2 text-xs text-neutral-500">และอีก {mcqRest} ข้อ — ดูตัวเลือกและเฉลยใน «ข้อความดิบ» หรือกดเปิดหน้าทำข้อสอบ</p>
          ) : null}
        </div>
      ) : null}

      {essayShow.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-neutral-600">ข้ออัตนัย</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-neutral-900">
            {essayShow.map((q) => (
              <li key={q.id} className="leading-relaxed">{q.prompt}</li>
            ))}
          </ul>
          {essayRest > 0 ? <p className="mt-1 text-xs text-neutral-500">และอีก {essayRest} ข้อ</p> : null}
        </div>
      ) : null}

      <p className="text-xs text-neutral-500">
        รายละเอียดเต็มอยู่ใน JSON ด้านล่าง — ใช้ส่งต่อระบบหรือแก้ไขได้
      </p>
    </div>
  );
}
