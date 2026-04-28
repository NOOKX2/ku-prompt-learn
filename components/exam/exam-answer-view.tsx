"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ExamBundle } from "@/lib/exam-json";

type Props = {
  examId: string;
  exam: ExamBundle;
};

export function ExamAnswerView({ examId, exam }: Props) {
  const [picked, setPicked] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`ku-exam-last-picks:${examId}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") {
        const next: Record<string, string> = {};
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
          if (typeof v === "string") next[k] = v;
        }
        setPicked(next);
      }
    } catch {
      // เฉลยยังดูได้ แม้ไม่มีคำตอบที่เคยเลือกในเครื่องนี้
    }
  }, [examId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">เฉลยข้อสอบ</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-black sm:text-2xl">{exam.title}</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/exam/${examId}/result`}
            className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            สรุปคะแนน
          </Link>
          <Link href={`/exam/${examId}`} className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-hover">
            กลับไปทำข้อสอบ
          </Link>
        </div>
      </div>

      {exam.mcq.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-black">เฉลยข้อปรนัย</h2>
          <ol className="space-y-4">
            {exam.mcq.map((q, idx) => {
              const userPick = picked[q.id];
              const isCorrectPick = Boolean(userPick) && userPick === q.correctChoiceId;
              const answered = Boolean(userPick);
              return (
                <li key={q.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
                  <p className="text-sm font-medium text-black">
                    ข้อ {idx + 1}. {q.prompt}
                  </p>
                  <p
                    className={`mt-2 rounded-lg border px-3 py-2 text-sm ${
                      !userPick
                        ? "border-neutral-200 bg-neutral-50 text-neutral-700"
                        : isCorrectPick
                          ? "border-green-200 bg-green-50 text-green-800"
                          : "border-red-200 bg-red-50 text-red-800"
                    }`}
                  >
                    {!answered ? (
                      <>คำตอบที่คุณเลือก: - (ยังไม่มีข้อมูลคำตอบที่เลือก)</>
                    ) : isCorrectPick ? (
                      <>
                        คำตอบที่คุณเลือก: <span className="font-semibold">{userPick}</span> (ถูกต้อง)
                      </>
                    ) : (
                      <>
                        คำตอบที่คุณเลือก: <span className="font-semibold">{userPick}</span> (ผิด) ·
                        เฉลย: <span className="font-semibold">{q.correctChoiceId}</span>
                      </>
                    )}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {q.choices.map((c) => {
                      const isCorrect = c.id === q.correctChoiceId;
                      const isPicked = userPick === c.id;
                      const isWrongPick = isPicked && !isCorrect;
                      const base = "rounded-xl border px-3 py-2 text-sm";
                      let klass = "border-neutral-200 bg-white text-neutral-700";
                      if (answered && isCorrectPick && isPicked) {
                        // Correct: highlight selected answer in green
                        klass = "border-green-300 bg-green-50 text-green-800";
                      } else if (answered && isWrongPick) {
                        // Wrong: selected wrong choice in red
                        klass = "border-red-300 bg-red-50 text-red-800";
                      } else if (answered && !isCorrectPick && isCorrect) {
                        // Wrong: actual correct choice in stronger green
                        klass = "border-green-600 bg-green-50 text-green-900";
                      } else if (!answered && isCorrect) {
                        // Unanswered: show system answer style
                        klass = "border-2 border-dashed border-green-400 bg-green-50/60 text-green-900";
                      }
                      return (
                        <li key={c.id} className={`${base} ${klass}`}>
                          <span className="font-mono font-semibold">
                            {(answered && isCorrectPick && isPicked) || (answered && !isCorrectPick && isCorrect)
                              ? "✅ "
                              : ""}
                            {c.id}.
                          </span>{" "}
                          {c.label}
                          {isPicked ? (
                            <span className={`ml-2 text-xs font-semibold ${isWrongPick ? "text-red-700" : "text-green-700"}`}>
                              (คำตอบที่คุณเลือก)
                            </span>
                          ) : null}
                          {answered && isCorrect ? (
                            <span className="ml-2 text-xs font-semibold text-green-700">(คำตอบที่ถูก)</span>
                          ) : null}
                          {!answered && isCorrect ? (
                            <span className="ml-2 text-xs font-semibold text-green-800">(เฉลย: {q.correctChoiceId})</span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {exam.essay.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-black">แนวเฉลยข้ออัตนัย</h2>
          <ol className="space-y-4">
            {exam.essay.map((q, idx) => (
              <li key={q.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-sm font-medium text-black">
                  ข้อ {exam.mcq.length + idx + 1}. {q.prompt}
                </p>
                {q.rubricHint ? <p className="mt-2 text-xs text-neutral-600">เกณฑ์: {q.rubricHint}</p> : null}
                <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
                  <span className="font-semibold">แนวเฉลย:</span> {q.modelAnswer ?? exam.answerKey?.essayNotes?.[q.id] ?? "ไม่มีแนวเฉลย"}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
