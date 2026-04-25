import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveExamFromContent } from "@/lib/exam-stored-content";
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
          where: { userId, NOT: { title: "ไม่สามารถสร้างข้อสอบได้" } },
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, score: true, content: true, createdAt: true },
        })
      ).map((e) => {
        const parsed = resolveExamFromContent(e.content);
        const totalMcq = parsed.ok ? parsed.exam.mcq.length : null;
        const correctMcq =
          e.score != null && totalMcq && totalMcq > 0
            ? Math.max(0, Math.min(totalMcq, Math.round((e.score / 100) * totalMcq)))
            : null;
        return {
          id: e.id,
          title: e.title,
          score: e.score,
          correctMcq,
          totalMcq,
          createdAt: e.createdAt.toISOString(),
        };
      })
    : [];

  return <ExamPageClient signedIn={signedIn} exams={exams} />;
}
