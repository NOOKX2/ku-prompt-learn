"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

export type SummaryListItem = {
  id: string;
  topic: string;
  createdAt: string;
};

export function SummarySavedList() {
  const { status } = useSession();
  const [summaries, setSummaries] = useState<SummaryListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (status !== "authenticated") {
      setSummaries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/summaries");
      const data = (await res.json()) as { summaries?: SummaryListItem[] };
      if (res.ok && Array.isArray(data.summaries)) {
        setSummaries(data.summaries);
      } else {
        setSummaries([]);
      }
    } catch {
      setSummaries([]);
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
        เพื่อดูสรุปที่บันทึกจากสตูดิโอ
      </p>
    );
  }

  if (loading) {
    return (
      <p className="text-sm text-neutral-500" aria-live="polite">
        กำลังโหลดรายการสรุป…
      </p>
    );
  }

  if (summaries.length === 0) {
    return (
      <p className="text-sm text-neutral-600">
        ยังไม่มีสรุปที่บันทึก — รันเทมเพลต &quot;ย่อยเนื้อหา&quot; ใน{" "}
        <Link href="/studio" className="font-medium text-brand underline hover:text-brand-hover">
          สตูดิโอ
        </Link>{" "}
        ขณะล็อกอิน ระบบจะเก็บสรุปจาก Dify ให้
      </p>
    );
  }

  return (
    <ul className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white shadow-sm">
      {summaries.map((s) => (
        <li key={s.id}>
          <Link
            href={`/summary/${s.id}`}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 transition hover:bg-neutral-50 sm:px-5"
          >
            <span className="min-w-0 flex-1 font-medium text-black">{s.topic}</span>
            <span className="shrink-0 text-xs text-neutral-500">
              {new Date(s.createdAt).toLocaleString("th-TH", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
