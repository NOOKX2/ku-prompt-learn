import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ReviewPlanPageClient } from "@/components/review-plan/review-plan-page-client";

export const metadata: Metadata = {
  title: "ตารางทบทวนบทเรียน",
  description: "ตารางอ่านหนังสือที่สร้างจากสตูดิโอ — คลิกรายการเพื่อดูรายละเอียด",
};

export default async function ReviewPlanPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const signedIn = Boolean(userId);
  const plans = userId
    ? (
        await prisma.reviewPlan.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, isPublic: true, createdAt: true },
        })
      ).map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }))
    : [];

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <ReviewPlanPageClient signedIn={signedIn} plans={plans} />
    </main>
  );
}

