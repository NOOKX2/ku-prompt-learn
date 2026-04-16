"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

export type ReviewPlanListItem = {
  id: string;
  title: string;
  createdAt: string;
};

export function ReviewPlanSavedList() {
  const { status } = useSession();
  const [plans, setPlans] = useState<ReviewPlanListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (status !== "authenticated") {
      setPlans([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/review-plans");
      const data = (await res.json()) as { plans?: ReviewPlanListItem[] };
      if (res.ok && Array.isArray(data.plans)) {
        setPlans(data.plans);
      } else {
        setPlans([]);
      }
    } catch {
      setPlans([]);
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
      <p className="text-sm text-amber-950 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3">
        <Link href="/login" className="font-medium text-brand underline hover:text-brand-hover">
          เข้าสู่ระบบ
        </Link>{" "}
        เพื่อดูตารางทบทวนบทเรียนที่สร้างจากสตูดิโอ
      </p>
    );
  }

  if (loading) {
    return (
      <p className="text-sm text-neutral-500" aria-live="polite">
        กำลังโหลดรายการตารางทบทวน…
      </p>
    );
  }

  if (plans.length === 0) {
    return (
      <p className="text-sm text-neutral-600">
        ยังไม่มีตารางทบทวน — รันเทมเพลต &quot;ตาราง + เช็คความเข้าใจ&quot; ใน{" "}
        <Link href="/studio" className="font-medium text-brand underline hover:text-brand-hover">
          สตูดิโอ
        </Link>{" "}
        ขณะล็อกอิน ระบบจะบันทึกให้
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((p) => (
        <li key={p.id} className="min-w-0">
          <Link
            href={`/review/${p.id}`}
            className="group block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
          >
            <div className="border-b border-neutral-200 bg-neutral-50/70 p-3">
              <div className="mx-auto flex aspect-4/3 w-full max-w-[220px] items-center justify-center rounded-xl border border-neutral-300 bg-white shadow-xs">
                <div className="w-[72%] rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
                  <div className="mx-auto mb-2 h-8 w-8 rounded-md bg-emerald-500 text-[10px] font-bold leading-8 text-white">
                    PLAN
                  </div>
                  <p className="line-clamp-3 text-[11px] font-medium leading-tight text-neutral-700">
                    {p.title}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 p-4">
              <p className="line-clamp-2 text-sm font-semibold text-black group-hover:text-brand">
                {p.title}
              </p>
              <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
                <span>
                  {new Date(p.createdAt).toLocaleString("th-TH", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                <span className="rounded-full bg-brand-muted/60 px-2 py-0.5 text-[11px] font-medium text-brand">
                  เปิดดู
                </span>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

