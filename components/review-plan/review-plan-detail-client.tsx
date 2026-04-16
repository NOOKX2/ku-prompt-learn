"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { JsonAnswerSummary, type JsonValue } from "@/components/prompt-studio/json-answer-summary";
import { coerceStoredReviewPlan } from "@/lib/review-plan-json";
import { ReviewPlanContentDisplay } from "./review-plan-content-display";

type ReviewPlanRow = {
  id: string;
  title: string;
  content: unknown;
  createdAt: string;
};

export function ReviewPlanDetailClient({ planId }: { planId: string }) {
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [row, setRow] = useState<ReviewPlanRow | null>(null);

  const load = useCallback(async () => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/review-plans/${planId}`);
      const data = (await res.json()) as {
        reviewPlan?: ReviewPlanRow;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "โหลดไม่สำเร็จ");
        setRow(null);
        return;
      }
      if (data.reviewPlan) setRow(data.reviewPlan);
    } catch {
      setError("โหลดไม่สำเร็จ");
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [planId, status]);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === "loading" || loading) {
    return (
      <p className="text-sm text-neutral-500" aria-live="polite">
        กำลังโหลดตารางทบทวน…
      </p>
    );
  }

  if (status !== "authenticated") {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
        <Link href="/login" className="font-medium text-brand underline hover:text-brand-hover">
          เข้าสู่ระบบ
        </Link>{" "}
        เพื่อเปิดตารางทบทวนนี้
      </p>
    );
  }

  if (error || !row) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-neutral-700">{error ?? "ไม่พบตารางทบทวน"}</p>
        <Link href="/review" className="text-sm font-medium text-brand underline hover:text-brand-hover">
          กลับไปรายการตารางทบทวน
        </Link>
      </div>
    );
  }

  const parsed = coerceStoredReviewPlan(row.content);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">รายละเอียดตารางทบทวน</p>
          <p className="mt-1 text-xs text-neutral-500">
            บันทึกเมื่อ{" "}
            {new Date(row.createdAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <Link
          href="/review"
          className="shrink-0 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-neutral-50"
        >
          ← รายการตารางทบทวนทั้งหมด
        </Link>
      </div>

      {parsed ? (
        <ReviewPlanContentDisplay data={parsed} />
      ) : (
        <div className="space-y-4">
          <p className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
            โครงสร้าง JSON ตารางทบทวนนี้ไม่ตรง schema — แสดง JSON ดิบแทน
          </p>
          <JsonAnswerSummary data={row.content as JsonValue} />
        </div>
      )}
    </div>
  );
}

