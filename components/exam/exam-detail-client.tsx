"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import type { ParseExamResult } from "@/lib/exam-json";
import { ExamRunner } from "./exam-runner";

type ExamRow = {
  id: string;
  title: string;
  score: number | null;
  createdAt: string;
  content: unknown;
};

export function ExamDetailClient({ examId }: { examId: string }) {
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [examRow, setExamRow] = useState<ExamRow | null>(null);
  const [parse, setParse] = useState<ParseExamResult | null>(null);

  const load = useCallback(async () => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/exams/${examId}`);
      const data = (await res.json()) as {
        exam?: ExamRow;
        parse?: ParseExamResult;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "โหลดไม่สำเร็จ");
        setExamRow(null);
        setParse(null);
        return;
      }
      if (data.exam) setExamRow(data.exam);
      if (data.parse) setParse(data.parse);
    } catch {
      setError("โหลดไม่สำเร็จ");
      setExamRow(null);
      setParse(null);
    } finally {
      setLoading(false);
    }
  }, [examId, status]);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === "loading" || loading) {
    return (
      <p className="text-sm text-neutral-500" aria-live="polite">
        กำลังโหลดข้อสอบ…
      </p>
    );
  }

  if (status !== "authenticated") {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
        <Link href="/login" className="font-medium text-brand underline hover:text-brand-hover">
          เข้าสู่ระบบ
        </Link>{" "}
        เพื่อเปิดข้อสอบนี้
      </p>
    );
  }

  if (error || !examRow) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-800">{error ?? "ไม่พบข้อสอบ"}</p>
        <Link href="/exam" className="text-sm font-medium text-brand underline hover:text-brand-hover">
          ← กลับไปหน้าข้อสอบ
        </Link>
      </div>
    );
  }

  if (!parse?.ok) {
    return (
      <div className="space-y-3">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {parse ? parse.error : "อ่าน JSON ข้อสอบไม่ได้"}
        </p>
        <Link href="/exam" className="text-sm font-medium text-brand underline hover:text-brand-hover">
          ← กลับไปหน้าข้อสอบ
        </Link>
      </div>
    );
  }

  const bundle = parse.exam;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">ข้อสอบที่บันทึก</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-black sm:text-2xl">{examRow.title}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            สร้างเมื่อ{" "}
            {new Date(examRow.createdAt).toLocaleString("th-TH", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            {examRow.score != null ? (
              <span className="ml-2 font-medium text-brand">คะแนนล่าสุด {examRow.score}%</span>
            ) : null}
          </p>
        </div>
        <Link
          href="/exam"
          className="text-sm font-medium text-brand underline hover:text-brand-hover"
        >
          ดูข้อสอบทั้งหมด
        </Link>
      </div>

      <ExamRunner exam={bundle} examRecordId={examRow.id} />
    </div>
  );
}
