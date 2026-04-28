import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { ReviewPlanDetailView } from "@/components/review-plan/review-plan-detail-view";
import { coerceStoredReviewPlan } from "@/lib/review-plan-json";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "รายละเอียดตารางทบทวน",
    description: `ตารางทบทวน — ${id.slice(0, 8)}…`,
  };
}

export default async function ReviewPlanByIdPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const row = await prisma.reviewPlan.findFirst({
    where: { id },
    select: { userId: true, content: true, isPublic: true, createdAt: true },
  });

  if (!row) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
        <div className="space-y-3">
          <p className="text-sm text-neutral-700">ไม่พบตารางทบทวน</p>
          <Link href="/review" className="text-sm font-medium text-brand underline hover:text-brand-hover">
            กลับไปรายการตารางทบทวน
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = userId === row.userId;

  if (!row.isPublic && !isOwner) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
        <p className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          <Link href="/login" className="font-medium text-brand underline hover:text-brand-hover">
            เข้าสู่ระบบ
          </Link>{" "}
          เพื่อเปิดตารางทบทวนนี้
        </p>
      </div>
    );
  }

  const parsed = coerceStoredReviewPlan(row.content);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
      <ReviewPlanDetailView
        reviewPlanId={id}
        createdAtIso={row.createdAt.toISOString()}
        parsed={parsed}
        rawContent={row.content}
        isOwner={isOwner}
        isPublic={row.isPublic}
      />
    </div>
  );
}
