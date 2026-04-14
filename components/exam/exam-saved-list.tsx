"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

export type ExamSummary = {
  id: string;
  title: string;
  score: number | null;
  createdAt: string;
};

export function ExamSavedList() {
  const { status } = useSession();
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (status !== "authenticated") {
      setExams([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/exams");
      const data = (await res.json()) as { exams?: ExamSummary[] };
      if (res.ok && Array.isArray(data.exams)) {
        setExams(data.exams);
      } else {
        setExams([]);
      }
    } catch {
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === "loading") {
    return (
      <p className="text-sm text-neutral-500" aria-live="polite">
        กำลังโหลด…
      </p>
    );
  }

  if (status !== "authenticated") {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
        <Link href="/login" className="font-medium text-brand underline hover:text-brand-hover">
          เข้าสู่ระบบ
        </Link>{" "}
        เพื่อดูข้อสอบที่สร้างจากสตูดิโอ (เทมเพลตข้อสอบจำลอง) และบันทึกอัตโนมัติหลัง Dify ตอบกลับ
      </p>
    );
  }

  if (loading) {
    return (
      <p className="text-sm text-neutral-500" aria-live="polite">
        กำลังโหลดรายการข้อสอบ…
      </p>
    );
  }

  if (exams.length === 0) {
    return (
      <p className="text-sm text-neutral-600">
        ยังไม่มีข้อสอบที่บันทึก — รันเทมเพลต &quot;ข้อสอบจำลอง&quot; ใน{" "}
        <Link href="/studio" className="font-medium text-brand underline hover:text-brand-hover">
          สตูดิโอ
        </Link>{" "}
        ขณะล็อกอิน ระบบจะเก็บคำตอบจาก Dify ให้
      </p>
    );
  }

  return (
    <ul className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white shadow-sm">
      {exams.map((e) => (
        <li key={e.id}>
          <Link
            href={`/exam/${e.id}`}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 transition hover:bg-neutral-50 sm:px-5"
          >
            <span className="min-w-0 flex-1 font-medium text-black">{e.title}</span>
            <span className="shrink-0 text-xs text-neutral-500">
              {new Date(e.createdAt).toLocaleString("th-TH", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {e.score != null ? (
                <span className="ml-2 font-medium text-brand">คะแนน {e.score}%</span>
              ) : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
