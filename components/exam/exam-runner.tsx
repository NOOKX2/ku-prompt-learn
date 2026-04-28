"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExamBundle } from "@/lib/exam-json";

type Props = {
  exam: ExamBundle;
  /** ถ้ามี — หลังส่งคำตอบจะบันทึกคะแนนปรนัย (เปอร์เซ็นต์ 0–100) ลงฐานข้อมูล */
  examRecordId?: string;
  showHeader?: boolean;
};

export function ExamRunner({ exam, examRecordId, showHeader = true }: Props) {
  const router = useRouter();
  const scorePatchSent = useRef(false);
  const [mcqPick, setMcqPick] = useState<Record<string, string>>({});
  const [essayDraft, setEssayDraft] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const mcqScore = useMemo(() => {
    if (!submitted) return null;
    let correct = 0;
    let total = 0;
    for (const q of exam.mcq) {
      total++;
      const pick = mcqPick[q.id];
      if (pick && pick === q.correctChoiceId) correct++;
    }
    return total ? { correct, total } : null;
  }, [exam.mcq, mcqPick, submitted]);

  useEffect(() => {
    if (!examRecordId || !submitted || !mcqScore || mcqScore.total === 0) return;
    if (scorePatchSent.current) return;
    scorePatchSent.current = true;
    const pct = Math.round((100 * mcqScore.correct) / mcqScore.total);
    void fetch(`/api/exams/${examRecordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: pct }),
    }).catch(() => {});
  }, [examRecordId, submitted, mcqScore]);

  const reset = useCallback(() => {
    setMcqPick({});
    setEssayDraft({});
    setSubmitted(false);
    setShowKey(false);
    scorePatchSent.current = false;
  }, []);

  const submitAndOpenResult = useCallback(async () => {
    let correct = 0;
    let total = 0;
    for (const q of exam.mcq) {
      total++;
      const pick = mcqPick[q.id];
      if (pick && pick === q.correctChoiceId) correct++;
    }
    const pct = total > 0 ? Math.round((100 * correct) / total) : 0;
    if (examRecordId) {
      try {
        localStorage.setItem(`ku-exam-last-picks:${examRecordId}`, JSON.stringify(mcqPick));
      } catch {
        // ไม่บังคับ
      }
    }

    if (examRecordId) {
      scorePatchSent.current = true;
      try {
        await fetch(`/api/exams/${examRecordId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: pct }),
        });
      } catch {
        // ไม่ขัดขวางการไปหน้าสรุปคะแนน
      }
      router.push(`/exam/${examRecordId}/result`);
      return;
    }

    router.push(`/exam/result?correct=${correct}&total=${total}`);
  }, [exam.mcq, examRecordId, mcqPick, router]);

  return (
    <div className="space-y-8">
      {showHeader ? (
        <header className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">ข้อสอบ (จาก JSON)</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-black sm:text-2xl">{exam.title}</h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
            {exam.subject ? <span>รายวิชา: {exam.subject}</span> : null}
            {exam.difficulty ? <span>ระดับ: {exam.difficulty}</span> : null}
          </div>
          {exam.instructions ? (
            <p className="mt-4 text-sm leading-relaxed text-neutral-800">{exam.instructions}</p>
          ) : null}
        </header>
      ) : null}

      {exam.mcq.length === 0 && exam.essay.length === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          ชุดนี้ไม่มีข้อปรนัยหรือข้ออัตนัยใน JSON — อาจเป็นกรณีแจ้งว่าขาดข้อมูลจากโมเดล
        </p>
      ) : null}

      {exam.mcq.length > 0 ? (
        <section className="space-y-5">
          <h2 className="text-lg font-semibold text-black">ข้อปรนัย</h2>
          <ol className="space-y-6">
            {exam.mcq.map((q, idx) => (
              <li
                key={q.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <p className="text-sm font-medium text-black">
                  ข้อ {idx + 1}. {q.prompt}
                </p>
                <ul className="mt-3 space-y-2">
                  {q.choices.map((c) => {
                    const id = `${q.id}-${c.id}`;
                    const checked = mcqPick[q.id] === c.id;
                    return (
                      <li key={c.id}>
                        <label
                          htmlFor={id}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${checked
                              ? "border-brand bg-brand-muted/60"
                              : "border-neutral-200 hover:border-neutral-300"
                            }`}
                        >
                          <input
                            id={id}
                            type="radio"
                            name={q.id}
                            value={c.id}
                            checked={checked}
                            disabled={submitted}
                            onChange={() => setMcqPick((prev) => ({ ...prev, [q.id]: c.id }))}
                            className="mt-0.5"
                          />
                          <span>
                            <span className="font-mono font-semibold text-brand">{c.id}.</span>{" "}
                            {c.label}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                {submitted && showKey ? (
                  <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-800">
                    เฉลย: <strong className="text-brand">{q.correctChoiceId}</strong>
                    {mcqPick[q.id] === q.correctChoiceId ? (
                      <span className="text-brand"> — ถูกต้อง</span>
                    ) : (
                      <span className="text-red-700"> — คุณเลือก {mcqPick[q.id] ?? "—"}</span>
                    )}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {exam.essay.length > 0 ? (
        <section className="space-y-5">
          <h2 className="text-lg font-semibold text-black">ข้ออัตนัย</h2>
          <ol className="space-y-6">
            {exam.essay.map((q, idx) => (
              <li
                key={q.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <p className="text-sm font-medium text-black">
                  ข้อ {exam.mcq.length + idx + 1}. {q.prompt}
                  {q.maxScore != null ? (
                    <span className="ml-2 font-normal text-neutral-600">({q.maxScore} คะแนน)</span>
                  ) : null}
                </p>
                {q.rubricHint ? (
                  <p className="mt-2 text-xs text-neutral-600">เกณฑ์: {q.rubricHint}</p>
                ) : null}
                <textarea
                  value={essayDraft[q.id] ?? ""}
                  onChange={(e) =>
                    setEssayDraft((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                  disabled={submitted}
                  rows={5}
                  className="mt-3 w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50/50 px-3 py-2 text-sm text-black outline-none ring-brand/20 focus:border-brand focus:ring-2 disabled:opacity-60"
                  placeholder="พิมพ์คำตอบของคุณ…"
                />
                {submitted && showKey && q.modelAnswer ? (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
                    <span className="font-semibold">แนวเฉลย:</span> {q.modelAnswer}
                  </div>
                ) : null}
                {submitted &&
                showKey &&
                exam.answerKey?.essayNotes?.[q.id] &&
                !q.modelAnswer ? (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
                    <span className="font-semibold">หมายเหตุเฉลย:</span>{" "}
                    {exam.answerKey.essayNotes[q.id]}
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-6">
        {!submitted ? (
          <button
            type="button"
            onClick={() => void submitAndOpenResult()}
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover"
          >
            ส่งคำตอบ
          </button>
        ) : (
          <>
            {mcqScore ? (
              <p className="text-sm font-medium text-black">
                คะแนนปรนัย: {mcqScore.correct} / {mcqScore.total}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-50"
            >
              {showKey ? "ซ่อนเฉลย" : "แสดงเฉลย / แนวเฉลย"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-50"
            >
              เริ่มใหม่
            </button>
          </>
        )}
      </div>
    </div>
  );
}
