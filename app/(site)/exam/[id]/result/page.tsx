import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { resolveExamFromContent } from "@/lib/exam-stored-content";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "สรุปคะแนนข้อสอบ",
    description: `สรุปคะแนนข้อสอบที่ทำล่าสุด — ${id.slice(0, 8)}…`,
  };
}

export default async function ExamResultPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
        <p className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          <Link href="/login" className="font-medium text-brand underline hover:text-brand-hover">
            เข้าสู่ระบบ
          </Link>{" "}
          เพื่อดูสรุปคะแนน
        </p>
      </div>
    );
  }

  const row = await prisma.exam.findFirst({
    where: { id, userId },
    select: { id: true, title: true, score: true, content: true, createdAt: true },
  });

  if (!row) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
        <div className="space-y-3">
          <p className="text-sm text-red-800">ไม่พบผลคะแนนของข้อสอบนี้</p>
          <Link href="/exam" className="text-sm font-medium text-brand underline hover:text-brand-hover">
            ← กลับไปหน้าข้อสอบ
          </Link>
        </div>
      </div>
    );
  }

  const parsed = resolveExamFromContent(row.content);
  if (!parsed.ok) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
        <div className="space-y-3">
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{parsed.error}</p>
          <Link href="/exam" className="text-sm font-medium text-brand underline hover:text-brand-hover">
            ← กลับไปหน้าข้อสอบ
          </Link>
        </div>
      </div>
    );
  }

  const total = parsed.exam.mcq.length;
  const scorePercent = row.score ?? 0;
  const correct = total > 0 ? Math.max(0, Math.min(total, Math.round((scorePercent / 100) * total))) : 0;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">สรุปคะแนน</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{row.title}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          ส่งคำตอบเมื่อ{" "}
          {new Date(row.createdAt).toLocaleString("th-TH", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs text-neutral-500">คะแนนเปอร์เซ็นต์</p>
            <p className="mt-1 text-2xl font-bold text-brand">{scorePercent}%</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs text-neutral-500">ตอบถูกปรนัย</p>
            <p className="mt-1 text-2xl font-bold text-black">
              {correct}/{total}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs text-neutral-500">จำนวนข้ออัตนัย</p>
            <p className="mt-1 text-2xl font-bold text-black">{parsed.exam.essay.length}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/exam/${row.id}/answer`}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-50"
          >
            ดูเฉลยข้อสอบ
          </Link>
          <Link
            href={`/exam/${row.id}`}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-50"
          >
            กลับหน้าข้อสอบ
          </Link>
          <Link
            href="/exam"
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
          >
            กลับไปรายการข้อสอบ
          </Link>
        </div>
      </div>
    </div>
  );
}
