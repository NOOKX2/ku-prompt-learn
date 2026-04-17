"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReviewPlan, ReviewPlanDay, ReviewPlanSession } from "@/lib/review-plan-json";
import { coerceStoredReviewPlan } from "@/lib/review-plan-json";

type ReviewPlanRow = {
  id: string;
  title: string;
  content: unknown;
};

function emptySession(): ReviewPlanSession {
  return { timeRange: "", topics: [""], reviewQuestions: [""] };
}

function emptyDay(index: number): ReviewPlanDay {
  return {
    dayIndex: index + 1,
    label: `Day ${index + 1}`,
    date: "",
    sessions: [emptySession()],
    dailyChecklist: [""],
  };
}

function emptyPlan(title = ""): ReviewPlan {
  return {
    id: "ตารางอ่านหนังสือ",
    planVersion: "1",
    title,
    subject: "",
    examDate: "",
    hoursPerDay: "",
    weak: "",
    syllabus: "",
    schedule: [emptyDay(0)],
    reviewChecklist: [""],
  };
}

function setAt<T>(arr: T[], index: number, next: T): T[] {
  return arr.map((v, i) => (i === index ? next : v));
}

export function ReviewPlanEditClient({ planId }: { planId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ReviewPlan>(emptyPlan());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/review-plans/${planId}`);
        const data = (await res.json()) as { reviewPlan?: ReviewPlanRow; error?: string };
        if (!res.ok || !data.reviewPlan) {
          if (!cancelled) setError(data.error ?? "โหลดข้อมูลไม่สำเร็จ");
          return;
        }
        if (cancelled) return;
        const parsed = coerceStoredReviewPlan(data.reviewPlan.content);
        if (parsed) {
          setForm(parsed);
        } else {
          setError("รูปแบบข้อมูลเดิมไม่ตรง schema ล่าสุด ระบบโหลดค่าเท่าที่มีให้แก้ในฟอร์ม");
          setForm(emptyPlan(data.reviewPlan.title));
        }
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
  }, [planId]);

  const onSave = async () => {
    setError(null);
    const t = form.title.trim();
    if (!t) {
      setError("ชื่อห้ามว่าง");
      return;
    }
    if (!form.subject.trim()) {
      setError("วิชาห้ามว่าง");
      return;
    }
    if (!form.examDate.trim()) {
      setError("วันที่สอบห้ามว่าง");
      return;
    }

    const normalizedContent: ReviewPlan = {
      id: "ตารางอ่านหนังสือ",
      planVersion: "1",
      title: t,
      subject: form.subject.trim(),
      examDate: form.examDate.trim(),
      hoursPerDay: form.hoursPerDay?.trim() || undefined,
      weak: form.weak?.trim() || undefined,
      syllabus: form.syllabus?.trim() || undefined,
      schedule: form.schedule.map((day, index) => ({
        dayIndex: day.dayIndex ?? index + 1,
        label: day.label?.trim() || `Day ${index + 1}`,
        date: day.date?.trim() || null,
        sessions: (day.sessions ?? [])
          .map((session) => ({
            timeRange: session.timeRange?.trim() || undefined,
            topics: (session.topics ?? []).map((x) => x.trim()).filter(Boolean),
            reviewQuestions: (session.reviewQuestions ?? []).map((x) => x.trim()).filter(Boolean),
          }))
          .filter((session) => session.timeRange || session.topics?.length || session.reviewQuestions?.length),
        dailyChecklist: (day.dailyChecklist ?? []).map((x) => x.trim()).filter(Boolean),
      })),
      reviewChecklist: form.reviewChecklist.map((x) => x.trim()).filter(Boolean),
    };

    setSaving(true);
    try {
      const res = await fetch(`/api/review-plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, content: normalizedContent }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      router.push(`/review/${planId}`);
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
        <h1 className="text-xl font-semibold sm:text-2xl">แก้ไขชีทตารางทบทวน</h1>
        <Link href={`/review/${planId}`} className="text-sm text-brand underline">
          กลับหน้ารายละเอียด
        </Link>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-800">ข้อมูลพื้นฐาน</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium">ชื่อชีท</span>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">วิชา</span>
            <input
              value={form.subject}
              onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">วันที่สอบ</span>
            <input
              value={form.examDate}
              onChange={(e) => setForm((prev) => ({ ...prev, examDate: e.target.value }))}
              placeholder="เช่น 2026-05-10"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">ชั่วโมงต่อวัน</span>
            <input
              value={form.hoursPerDay ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, hoursPerDay: e.target.value }))}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium">จุดอ่อน</span>
            <textarea
              value={form.weak ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, weak: e.target.value }))}
              rows={2}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium">Syllabus</span>
            <textarea
              value={form.syllabus ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, syllabus: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-neutral-800">ตารางทบทวนรายวัน</h2>
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, schedule: [...prev.schedule, emptyDay(prev.schedule.length)] }))}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium"
          >
            + เพิ่มวัน
          </button>
        </div>
        <div className="space-y-4">
          {form.schedule.map((day, dayIndex) => (
            <div key={`day-${dayIndex}`} className="space-y-3 rounded-xl border border-neutral-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">วัน {dayIndex + 1}</p>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, schedule: prev.schedule.filter((_, i) => i !== dayIndex) }))
                  }
                  className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700"
                >
                  ลบวัน
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <input
                  value={day.label ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      schedule: setAt(prev.schedule, dayIndex, { ...day, label: e.target.value }),
                    }))
                  }
                  placeholder="Label"
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
                <input
                  value={day.date ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      schedule: setAt(prev.schedule, dayIndex, { ...day, date: e.target.value }),
                    }))
                  }
                  placeholder="Date"
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={day.dayIndex ?? dayIndex + 1}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      schedule: setAt(prev.schedule, dayIndex, {
                        ...day,
                        dayIndex: Number(e.target.value) || dayIndex + 1,
                      }),
                    }))
                  }
                  placeholder="Day Index"
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-2 rounded-lg bg-neutral-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-neutral-700">Sessions</p>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        schedule: setAt(prev.schedule, dayIndex, {
                          ...day,
                          sessions: [...(day.sessions ?? []), emptySession()],
                        }),
                      }))
                    }
                    className="rounded-lg border border-neutral-300 px-2 py-1 text-xs"
                  >
                    + เพิ่ม session
                  </button>
                </div>
                {(day.sessions ?? []).map((session, sessionIndex) => (
                  <div key={`session-${sessionIndex}`} className="space-y-2 rounded-lg border border-neutral-200 bg-white p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium">Session {sessionIndex + 1}</p>
                      <button
                        type="button"
                        onClick={() => {
                          const nextSessions = (day.sessions ?? []).filter((_, i) => i !== sessionIndex);
                          setForm((prev) => ({
                            ...prev,
                            schedule: setAt(prev.schedule, dayIndex, { ...day, sessions: nextSessions }),
                          }));
                        }}
                        className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700"
                      >
                        ลบ
                      </button>
                    </div>
                    <input
                      value={session.timeRange ?? ""}
                      onChange={(e) => {
                        const nextSessions = setAt(day.sessions ?? [], sessionIndex, {
                          ...session,
                          timeRange: e.target.value,
                        });
                        setForm((prev) => ({
                          ...prev,
                          schedule: setAt(prev.schedule, dayIndex, { ...day, sessions: nextSessions }),
                        }));
                      }}
                      placeholder="ช่วงเวลา"
                      className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                    />
                    <textarea
                      value={(session.topics ?? []).join("\n")}
                      onChange={(e) => {
                        const nextSessions = setAt(day.sessions ?? [], sessionIndex, {
                          ...session,
                          topics: e.target.value.split("\n"),
                        });
                        setForm((prev) => ({
                          ...prev,
                          schedule: setAt(prev.schedule, dayIndex, { ...day, sessions: nextSessions }),
                        }));
                      }}
                      rows={2}
                      placeholder="หัวข้อทบทวน (1 บรรทัดต่อ 1 รายการ)"
                      className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                    />
                    <textarea
                      value={(session.reviewQuestions ?? []).join("\n")}
                      onChange={(e) => {
                        const nextSessions = setAt(day.sessions ?? [], sessionIndex, {
                          ...session,
                          reviewQuestions: e.target.value.split("\n"),
                        });
                        setForm((prev) => ({
                          ...prev,
                          schedule: setAt(prev.schedule, dayIndex, { ...day, sessions: nextSessions }),
                        }));
                      }}
                      rows={2}
                      placeholder="คำถามทบทวน (1 บรรทัดต่อ 1 รายการ)"
                      className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                ))}
              </div>

              <textarea
                value={(day.dailyChecklist ?? []).join("\n")}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    schedule: setAt(prev.schedule, dayIndex, { ...day, dailyChecklist: e.target.value.split("\n") }),
                  }))
                }
                rows={2}
                placeholder="Daily checklist (1 บรรทัดต่อ 1 รายการ)"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-neutral-800">รายการเช็คลิสต์รวม</h2>
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, reviewChecklist: [...prev.reviewChecklist, ""] }))}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium"
          >
            + เพิ่มรายการ
          </button>
        </div>
        <div className="space-y-2">
          {form.reviewChecklist.map((item, index) => (
            <div key={`review-check-${index}`} className="flex items-center gap-2">
              <input
                value={item}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    reviewChecklist: setAt(prev.reviewChecklist, index, e.target.value),
                  }))
                }
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    reviewChecklist: prev.reviewChecklist.filter((_, i) => i !== index),
                  }))
                }
                className="rounded-lg border border-red-200 px-2 py-1.5 text-xs text-red-700"
              >
                ลบ
              </button>
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
        <Link href={`/review/${planId}`} className="rounded-xl border border-neutral-300 px-4 py-2 text-sm">
          ยกเลิก
        </Link>
      </div>
    </div>
  );
}

