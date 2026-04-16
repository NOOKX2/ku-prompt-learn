import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ExamPageClient } from "@/components/exam/exam-page-client";

export const metadata: Metadata = {
  title: "รายการข้อสอบทั้งหมด",
  description: "แสดงรายการข้อสอบที่สร้างจาก Dify และเปิดทำรายชุดที่หน้า /exam/[id]",
};

export default async function ExamPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const signedIn = Boolean(userId);
  const exams = userId
    ? (
        await prisma.exam.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, score: true, createdAt: true },
        })
      ).map((e) => ({ ...e, createdAt: e.createdAt.toISOString() }))
    : [];

  return <ExamPageClient signedIn={signedIn} exams={exams} />;
}
