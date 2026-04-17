import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { SummaryDetailView } from "@/components/summary/summary-detail-view";
import { prisma } from "@/lib/prisma";
import { coerceStoredSimplifySummary } from "@/lib/simplify-summary";

type Props = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "รายละเอียดสรุป",
    description: `สรุปที่บันทึก — ${id.slice(0, 8)}…`,
  };
}

export default async function SummaryByIdPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
        <p className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          <Link href="/login" className="font-medium text-brand underline hover:text-brand-hover">
            เข้าสู่ระบบ
          </Link>{" "}
          เพื่อเปิดสรุปนี้
        </p>
      </main>
    );
  }

  const row = await prisma.summary.findFirst({
    where: { id, userId },
    select: { content: true, createdAt: true },
  });

  if (!row) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
        <div className="space-y-3">
          <p className="text-sm text-neutral-700">ไม่พบสรุป</p>
          <Link href="/summary" className="text-sm font-medium text-brand underline hover:text-brand-hover">
            กลับไปรายการสรุป
          </Link>
        </div>
      </main>
    );
  }

  const parsed = coerceStoredSimplifySummary(row.content);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
      <SummaryDetailView
        createdAtIso={row.createdAt.toISOString()}
        parsed={parsed}
        rawContent={row.content}
      />
    </main>
  );
}
