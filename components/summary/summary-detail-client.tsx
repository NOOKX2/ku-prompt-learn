"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { SummaryContentDisplay } from "./summary-content-display";
import { coerceStoredSimplifySummary } from "@/lib/simplify-summary";
import { JsonAnswerSummary, type JsonValue } from "@/components/prompt-studio/json-answer-summary";

type SummaryRow = {
  id: string;
  topic: string;
  content: unknown;
  createdAt: string;
};

export function SummaryDetailClient({ summaryId }: { summaryId: string }) {
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [row, setRow] = useState<SummaryRow | null>(null);

  const load = useCallback(async () => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/summaries/${summaryId}`);
      const data = (await res.json()) as {
        summary?: SummaryRow;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "โหลดไม่สำเร็จ");
        setRow(null);
        return;
      }
      if (data.summary) setRow(data.summary);
    } catch {
      setError("โหลดไม่สำเร็จ");
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [summaryId, status]);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === "loading" || loading) {
    return (
      <p className="text-sm text-neutral-500" aria-live="polite">
        กำลังโหลดสรุป…
      </p>
    );
  }

  if (status !== "authenticated") {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
        <Link href="/login" className="font-medium text-brand underline hover:text-brand-hover">
          เข้าสู่ระบบ
        </Link>{" "}
        เพื่อเปิดสรุปนี้
      </p>
    );
  }

  if (error || !row) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-neutral-700">{error ?? "ไม่พบสรุป"}</p>
        <Link href="/summary" className="text-sm font-medium text-brand underline hover:text-brand-hover">
          กลับไปรายการสรุป
        </Link>
      </div>
    );
  }

  const parsed = coerceStoredSimplifySummary(row.content);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">รายละเอียดสรุป</p>
          <p className="mt-1 text-xs text-neutral-500">
            บันทึกเมื่อ{" "}
            {new Date(row.createdAt).toLocaleString("th-TH", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <Link
          href="/summary"
          className="shrink-0 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-neutral-50"
        >
          ← รายการสรุปทั้งหมด
        </Link>
      </div>

      {parsed ? (
        <SummaryContentDisplay data={parsed} />
      ) : (
        <div className="space-y-4">
          <p className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
            โครงสร้างสรุปนี้ไม่ตรงรูปแบบที่แสดงแบบการ์ด — แสดง JSON ดิบแทน
          </p>
          <JsonAnswerSummary data={row.content as JsonValue} />
        </div>
      )}
    </div>
  );
}
