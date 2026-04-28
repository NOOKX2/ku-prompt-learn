"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

export type ReviewPlanListItem = {
  id: string;
  title: string;
  isPublic: boolean;
  createdAt: string;
};

type Props = {
  signedIn: boolean;
  plans: ReviewPlanListItem[];
};

export function ReviewPlanSavedList({ signedIn, plans }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<ReviewPlanListItem[]>(plans);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setItems(plans);
  }, [plans]);

  const deleteItem = async (item: ReviewPlanListItem) => {
    const ok = window.confirm(`ลบชีทตารางทบทวน "${item.title}" ?`);
    if (!ok) return;
    const res = await fetch(`/api/review-plans/${item.id}`, { method: "DELETE" });
    if (!res.ok) return;
    setItems((prev) => prev.filter((x) => x.id !== item.id));
    startTransition(() => router.refresh());
  };

  if (!signedIn) {
    return (
      <p className="text-sm text-amber-950 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3">
        <Link href="/login" className="font-medium text-brand underline hover:text-brand-hover">
          เข้าสู่ระบบ
        </Link>{" "}
        เพื่อดูตารางทบทวนบทเรียนที่สร้างจากสตูดิโอ
      </p>
    );
  }

  if (items.length === 0) {
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
      {items.map((p) => (
        <li key={p.id} className="min-w-0">
          <div className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
            <Link href={`/review/${p.id}`} className="block">
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
            </Link>

            <div className="space-y-2 p-4">
              <div className="flex flex-wrap items-start gap-1.5">
                <p className="line-clamp-2 flex-1 text-sm font-semibold text-black group-hover:text-brand">
                  {p.title}
                </p>
                {p.isPublic ? (
                  <span className="shrink-0 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                    สาธารณะ
                  </span>
                ) : null}
              </div>
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
              <div className="flex gap-2 pt-1">
                <Link
                  href={`/review/${p.id}/edit`}
                  aria-label="แก้ไข"
                  title="แก้ไข"
                  className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={() => void deleteItem(p)}
                  disabled={pending}
                  aria-label="ลบ"
                  title="ลบ"
                  className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

