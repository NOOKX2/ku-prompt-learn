"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ExamBundle, ExamEssayQuestion, ExamMcqQuestion } from "@/lib/exam-json";
import { buildExamStoredContent, resolveExamFromContent } from "@/lib/exam-stored-content";

type ExamRow = {
  id: string;
  title: string;
  score: number | null;
  content: unknown;
};

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptyMcq(): ExamMcqQuestion {
  const firstChoiceId = makeId("choice");
  return {
    id: makeId("mcq"),
    type: "mcq",
    prompt: "",
    choices: [
      { id: firstChoiceId, label: "" },
      { id: makeId("choice"), label: "" },
    ],
    correctChoiceId: firstChoiceId,
  };
}

function emptyEssay(): ExamEssayQuestion {
  return { id: makeId("essay"), type: "essay", prompt: "" };
}

function emptyBundle(title = ""): ExamBundle {
  return {
    examVersion: "1",
    title,
    subject: "",
    difficulty: "",
    instructions: "",
    mcq: [emptyMcq()],
    essay: [emptyEssay()],
  };
}

function setAt<T>(arr: T[], index: number, next: T): T[] {
  return arr.map((v, i) => (i === index ? next : v));
}

export function ExamEditClient({ examId }: { examId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [score, setScore] = useState("");
  const [examForm, setExamForm] = useState<ExamBundle>(emptyBundle());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/exams/${examId}`);
        const data = (await res.json()) as { exam?: ExamRow; error?: string };
        if (!res.ok || !data.exam) {
          if (!cancelled) setError(data.error ?? "โหลดข้อมูลไม่สำเร็จ");
          return;
        }
        if (cancelled) return;
        setTitle(data.exam.title);
        setScore(data.exam.score == null ? "" : String(data.exam.score));
        const parsed = resolveExamFromContent(data.exam.content);
        if (!parsed.ok) {
          setError("ข้อมูลข้อสอบเดิมไม่สมบูรณ์ ระบบเปิดฟอร์มว่างให้แก้ไขแทน");
          setExamForm(emptyBundle(data.exam.title));
          return;
        }
        setExamForm(parsed.exam);
      } catch {
        if (!cancelled) setError("โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [examId]);

  const onSave = async () => {
    setError(null);
    const t = title.trim();
    if (!t) {
      setError("ชื่อข้อสอบห้ามว่าง");
      return;
    }

    let nextScore: number | null = null;
    if (score.trim() !== "") {
      const n = Number(score);
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        setError("คะแนนต้องเป็นตัวเลข 0-100");
        return;
      }
      nextScore = Math.round(n);
    }

    const normalizedExam: ExamBundle = {
      examVersion: "1",
      title: t,
      subject: examForm.subject?.trim() || undefined,
      difficulty: examForm.difficulty?.trim() || undefined,
      instructions: examForm.instructions?.trim() || undefined,
      mcq: examForm.mcq
        .map((q) => ({
          id: q.id.trim() || makeId("mcq"),
          type: "mcq" as const,
          prompt: q.prompt.trim(),
          choices: q.choices
            .map((c) => ({ id: c.id.trim() || makeId("choice"), label: c.label.trim() }))
            .filter((c) => c.label.length > 0),
          correctChoiceId: q.correctChoiceId.trim(),
        }))
        .filter((q) => q.prompt.length > 0),
      essay: examForm.essay
        .map((q) => ({
          id: q.id.trim() || makeId("essay"),
          type: "essay" as const,
          prompt: q.prompt.trim(),
          maxScore: q.maxScore,
          rubricHint: q.rubricHint?.trim() || undefined,
          modelAnswer: q.modelAnswer?.trim() || undefined,
        }))
        .filter((q) => q.prompt.length > 0),
    };

    for (const q of normalizedExam.mcq) {
      if (q.choices.length < 2) {
        setError("ข้อสอบปรนัยแต่ละข้อควรมีตัวเลือกอย่างน้อย 2 ตัวเลือก");
        return;
      }
      const hasCorrect = q.choices.some((c) => c.id === q.correctChoiceId);
      if (!hasCorrect) q.correctChoiceId = q.choices[0]?.id ?? "";
      if (!q.correctChoiceId) {
        setError("กรุณาระบุเฉลยสำหรับข้อสอบปรนัย");
        return;
      }
    }

    const contentPayload = buildExamStoredContent(JSON.stringify(normalizedExam), normalizedExam);

    setSaving(true);
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t,
          score: nextScore,
          content: contentPayload,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      router.push(`/exam/${examId}`);
      router.refresh();
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-neutral-500">กำลังโหลด…</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold sm:text-2xl">แก้ไขชีทข้อสอบ</h1>
        <Link href={`/exam/${examId}`} className="text-sm text-brand underline">
          กลับหน้ารายละเอียด
        </Link>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium">ชื่อข้อสอบ</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">คะแนน (0-100)</span>
          <input
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="เว้นว่างได้"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-800">ข้อมูลข้อสอบ</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium">วิชา</span>
            <input
              value={examForm.subject ?? ""}
              onChange={(e) => setExamForm((prev) => ({ ...prev, subject: e.target.value }))}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">ระดับความยาก</span>
            <input
              value={examForm.difficulty ?? ""}
              onChange={(e) => setExamForm((prev) => ({ ...prev, difficulty: e.target.value }))}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium">คำชี้แจง</span>
            <textarea
              value={examForm.instructions ?? ""}
              onChange={(e) => setExamForm((prev) => ({ ...prev, instructions: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-neutral-800">ข้อสอบปรนัย (MCQ)</h2>
          <button
            type="button"
            onClick={() => setExamForm((prev) => ({ ...prev, mcq: [...prev.mcq, emptyMcq()] }))}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium"
          >
            + เพิ่มข้อ
          </button>
        </div>
        <div className="space-y-4">
          {examForm.mcq.map((q, qIdx) => (
            <div key={q.id} className="space-y-2 rounded-xl border border-neutral-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">ข้อที่ {qIdx + 1}</p>
                <button
                  type="button"
                  onClick={() =>
                    setExamForm((prev) => ({ ...prev, mcq: prev.mcq.filter((_, i) => i !== qIdx) }))
                  }
                  className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700"
                >
                  ลบข้อ
                </button>
              </div>
              <textarea
                value={q.prompt}
                onChange={(e) =>
                  setExamForm((prev) => ({
                    ...prev,
                    mcq: setAt(prev.mcq, qIdx, { ...q, prompt: e.target.value }),
                  }))
                }
                rows={2}
                placeholder="โจทย์คำถาม"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              <div className="space-y-2">
                {q.choices.map((c, cIdx) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={q.correctChoiceId === c.id}
                      onChange={() =>
                        setExamForm((prev) => ({
                          ...prev,
                          mcq: setAt(prev.mcq, qIdx, { ...q, correctChoiceId: c.id }),
                        }))
                      }
                    />
                    <input
                      value={c.label}
                      onChange={(e) => {
                        const nextChoices = setAt(q.choices, cIdx, { ...c, label: e.target.value });
                        setExamForm((prev) => ({
                          ...prev,
                          mcq: setAt(prev.mcq, qIdx, { ...q, choices: nextChoices }),
                        }));
                      }}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      placeholder={`ตัวเลือก ${cIdx + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nextChoices = q.choices.filter((_, i) => i !== cIdx);
                        const nextCorrect =
                          q.correctChoiceId === c.id ? (nextChoices[0]?.id ?? "") : q.correctChoiceId;
                        setExamForm((prev) => ({
                          ...prev,
                          mcq: setAt(prev.mcq, qIdx, { ...q, choices: nextChoices, correctChoiceId: nextCorrect }),
                        }));
                      }}
                      className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700"
                    >
                      ลบ
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const nextChoice = { id: makeId("choice"), label: "" };
                    setExamForm((prev) => ({
                      ...prev,
                      mcq: setAt(prev.mcq, qIdx, { ...q, choices: [...q.choices, nextChoice] }),
                    }));
                  }}
                  className="rounded-lg border border-neutral-300 px-2 py-1 text-xs"
                >
                  + เพิ่มตัวเลือก
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-neutral-800">ข้อสอบอัตนัย (Essay)</h2>
          <button
            type="button"
            onClick={() => setExamForm((prev) => ({ ...prev, essay: [...prev.essay, emptyEssay()] }))}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium"
          >
            + เพิ่มข้อ
          </button>
        </div>
        <div className="space-y-4">
          {examForm.essay.map((q, index) => (
            <div key={q.id} className="space-y-2 rounded-xl border border-neutral-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">ข้อที่ {index + 1}</p>
                <button
                  type="button"
                  onClick={() =>
                    setExamForm((prev) => ({ ...prev, essay: prev.essay.filter((_, i) => i !== index) }))
                  }
                  className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700"
                >
                  ลบข้อ
                </button>
              </div>
              <textarea
                value={q.prompt}
                onChange={(e) =>
                  setExamForm((prev) => ({
                    ...prev,
                    essay: setAt(prev.essay, index, { ...q, prompt: e.target.value }),
                  }))
                }
                rows={2}
                placeholder="โจทย์คำถาม"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              <div className="grid gap-2 sm:grid-cols-3">
                <input
                  type="number"
                  value={q.maxScore ?? ""}
                  onChange={(e) =>
                    setExamForm((prev) => ({
                      ...prev,
                      essay: setAt(prev.essay, index, {
                        ...q,
                        maxScore: e.target.value === "" ? undefined : Number(e.target.value),
                      }),
                    }))
                  }
                  placeholder="คะแนนเต็ม"
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
                <input
                  value={q.rubricHint ?? ""}
                  onChange={(e) =>
                    setExamForm((prev) => ({
                      ...prev,
                      essay: setAt(prev.essay, index, { ...q, rubricHint: e.target.value }),
                    }))
                  }
                  placeholder="เกณฑ์ให้คะแนน"
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm sm:col-span-2"
                />
              </div>
              <textarea
                value={q.modelAnswer ?? ""}
                onChange={(e) =>
                  setExamForm((prev) => ({
                    ...prev,
                    essay: setAt(prev.essay, index, { ...q, modelAnswer: e.target.value }),
                  }))
                }
                rows={3}
                placeholder="แนวคำตอบ"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={saving}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก…" : "บันทึก"}
        </button>
        <Link href={`/exam/${examId}`} className="rounded-xl border border-neutral-300 px-4 py-2 text-sm">
          ยกเลิก
        </Link>
      </div>
    </div>
  );
}

