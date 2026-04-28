import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SummaryPageClient } from "./components/summary-page-client";

export const metadata: Metadata = {
  title: "รายการสรุปทั้งหมด",
  description: "สรุปที่บันทึกจากสตูดิโอ — เปิดดูรายละเอียดแต่ละรายการ",
};

export default async function SummaryPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const signedIn = Boolean(userId);
  const summaries = userId
    ? (
        await prisma.summary.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: { id: true, topic: true, isPublic: true, createdAt: true },
        })
      ).map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }))
    : [];

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <SummaryPageClient signedIn={signedIn} summaries={summaries} />
    </main>
  );
}
