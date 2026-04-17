"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SimplifySummary } from "@/lib/simplify-summary";
import { coerceStoredSimplifySummary } from "@/lib/simplify-summary";

type SummaryRow = {
  id: string;
  topic: string;
  content: unknown;
};

function buildEmptySummary(topic = ""): SimplifySummary {
  return {
    summaryVersion: "1",
    topic,
    tone: "",
    length: "",
    corePoints: [""],
    explanationSteps: [{ title: "", detail: "", example: "" }],
    examConnection: "",
    keywords: [{ term: "", definition: "" }],
    needsMoreInfo: false,
    missingInfo: [""],
  };
}

function setAt<T>(arr: T[], index: number, next: T): T[] {
  return arr.map((v, i) => (i === index ? next : v));
}

export function SummaryEditClient({ summaryId }: { summaryId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SimplifySummary>(buildEmptySummary());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/summaries/${summaryId}`);
        const data = (await res.json()) as { summary?: SummaryRow; error?: string };
        if (!res.ok || !data.summary) {
          if (!cancelled) setError(data.error ?? "โหลดข้อมูลไม่สำเร็จ");
          return;
        }
        if (cancelled) return;
        const parsed = coerceStoredSimplifySummary(data.summary.content);
        if (parsed) {
          setForm(parsed);
        } else {
          setError("รูปแบบข้อมูลเดิมไม่ตรง schema ล่าสุด ระบบโหลดค่าเท่าที่มีให้แก้ในฟอร์ม");
          setForm(buildEmptySummary(data.summary.topic));
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
  }, [summaryId]);

  const onSave = async () => {
    setError(null);
    const t = form.topic.trim();
    if (!t) {
      setError("หัวข้อห้ามว่าง");
      return;
    }
    if (!form.tone.trim()) {
      setError("กรุณากรอกโทนการอธิบาย");
      return;
    }
    if (!form.length.trim()) {
      setError("กรุณากรอกความยาวเนื้อหา");
      return;
    }

    const normalizedContent: SimplifySummary = {
      ...form,
      summaryVersion: "1",
      topic: t,
      tone: form.tone.trim(),
      length: form.length.trim(),
      corePoints: form.corePoints.map((x) => x.trim()).filter(Boolean),
      explanationSteps: form.explanationSteps
        .map((x) => ({
          title: x.title.trim(),
          detail: x.detail.trim(),
          example: x.example?.trim() ?? "",
        }))
        .filter((x) => x.title || x.detail || x.example)
        .map((x) => (x.example ? x : { title: x.title, detail: x.detail })),
      examConnection: form.examConnection.trim(),
      keywords: form.keywords
        .map((x) => ({ term: x.term.trim(), definition: x.definition.trim() }))
        .filter((x) => x.term || x.definition),
      missingInfo: form.missingInfo.map((x) => x.trim()).filter(Boolean),
    };

    if (normalizedContent.corePoints.length === 0) {
      setError("กรุณาใส่แกนเรื่องสำคัญอย่างน้อย 1 ข้อ");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/summaries/${summaryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: t, content: normalizedContent }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      router.push(`/summary/${summaryId}`);
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
        <h1 className="text-xl font-semibold sm:text-2xl">แก้ไขชีทสรุป</h1>
        <Link href={`/summary/${summaryId}`} className="text-sm text-brand underline">
          กลับหน้ารายละเอียด
        </Link>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-800">ข้อมูลพื้นฐาน</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block space-y-1 sm:col-span-3">
            <span className="text-sm font-medium">หัวข้อ</span>
            <input
              value={form.topic}
              onChange={(e) => setForm((prev) => ({ ...prev, topic: e.target.value }))}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">โทน</span>
            <input
              value={form.tone}
              onChange={(e) => setForm((prev) => ({ ...prev, tone: e.target.value }))}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">ความยาว</span>
            <input
              value={form.length}
              onChange={(e) => setForm((prev) => ({ ...prev, length: e.target.value }))}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1 sm:col-span-3">
            <span className="text-sm font-medium">ความเชื่อมโยงกับข้อสอบ</span>
            <textarea
              value={form.examConnection}
              onChange={(e) => setForm((prev) => ({ ...prev, examConnection: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-neutral-800">แกนเรื่องสำคัญ</h2>
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, corePoints: [...prev.corePoints, ""] }))}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium"
          >
            + เพิ่มหัวข้อย่อย
          </button>
        </div>
        <div className="space-y-2">
          {form.corePoints.map((point, index) => (
            <div key={`core-${index}`} className="flex items-center gap-2">
              <input
                value={point}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, corePoints: setAt(prev.corePoints, index, e.target.value) }))
                }
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    corePoints: prev.corePoints.filter((_, i) => i !== index),
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

      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-neutral-800">อธิบายทีละขั้น (ตาราง)</h2>
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                explanationSteps: [...prev.explanationSteps, { title: "", detail: "", example: "" }],
              }))
            }
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium"
          >
            + เพิ่มแถว
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-left text-xs font-semibold text-neutral-600">
              <tr>
                <th className="px-3 py-2">หัวข้อขั้น</th>
                <th className="px-3 py-2">รายละเอียด</th>
                <th className="px-3 py-2">ตัวอย่าง</th>
                <th className="px-3 py-2 text-right">ลบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {form.explanationSteps.map((step, index) => (
                <tr key={`step-${index}`}>
                  <td className="px-3 py-2 align-top">
                    <input
                      value={step.title}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          explanationSteps: setAt(prev.explanationSteps, index, {
                            ...step,
                            title: e.target.value,
                          }),
                        }))
                      }
                      className="w-44 rounded-lg border border-neutral-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <textarea
                      value={step.detail}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          explanationSteps: setAt(prev.explanationSteps, index, {
                            ...step,
                            detail: e.target.value,
                          }),
                        }))
                      }
                      rows={3}
                      className="w-full min-w-72 rounded-lg border border-neutral-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <textarea
                      value={step.example ?? ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          explanationSteps: setAt(prev.explanationSteps, index, {
                            ...step,
                            example: e.target.value,
                          }),
                        }))
                      }
                      rows={3}
                      className="w-full min-w-72 rounded-lg border border-neutral-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-3 py-2 align-top text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          explanationSteps: prev.explanationSteps.filter((_, i) => i !== index),
                        }))
                      }
                      className="rounded-lg border border-red-200 px-2 py-1.5 text-xs text-red-700"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-neutral-800">คำสำคัญ (ตาราง)</h2>
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, keywords: [...prev.keywords, { term: "", definition: "" }] }))}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium"
          >
            + เพิ่มแถว
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-left text-xs font-semibold text-neutral-600">
              <tr>
                <th className="px-3 py-2">คำศัพท์</th>
                <th className="px-3 py-2">คำอธิบาย</th>
                <th className="px-3 py-2 text-right">ลบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {form.keywords.map((kw, index) => (
                <tr key={`kw-${index}`}>
                  <td className="px-3 py-2 align-top">
                    <input
                      value={kw.term}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          keywords: setAt(prev.keywords, index, { ...kw, term: e.target.value }),
                        }))
                      }
                      className="w-52 rounded-lg border border-neutral-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <textarea
                      value={kw.definition}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          keywords: setAt(prev.keywords, index, { ...kw, definition: e.target.value }),
                        }))
                      }
                      rows={2}
                      className="w-full min-w-96 rounded-lg border border-neutral-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-3 py-2 align-top text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          keywords: prev.keywords.filter((_, i) => i !== index),
                        }))
                      }
                      className="rounded-lg border border-red-200 px-2 py-1.5 text-xs text-red-700"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={form.needsMoreInfo}
            onChange={(e) => setForm((prev) => ({ ...prev, needsMoreInfo: e.target.checked }))}
          />
          ต้องการข้อมูลเพิ่ม
        </label>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-neutral-800">ข้อมูลที่ขาด</h2>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, missingInfo: [...prev.missingInfo, ""] }))}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium"
            >
              + เพิ่มรายการ
            </button>
          </div>
          {form.missingInfo.map((item, index) => (
            <div key={`missing-${index}`} className="flex items-center gap-2">
              <input
                value={item}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, missingInfo: setAt(prev.missingInfo, index, e.target.value) }))
                }
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    missingInfo: prev.missingInfo.filter((_, i) => i !== index),
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
        <Link href={`/summary/${summaryId}`} className="rounded-xl border border-neutral-300 px-4 py-2 text-sm">
          ยกเลิก
        </Link>
      </div>
    </div>
  );
}

