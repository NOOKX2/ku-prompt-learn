import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { ExamAnswerView } from "../../components/exam-answer-view";
import { resolveExamFromContent } from "@/lib/exam-stored-content";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "เฉลยข้อสอบ",
    description: `เฉลยข้อสอบที่บันทึก — ${id.slice(0, 8)}…`,
  };
}

export default async function ExamAnswerPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const row = await prisma.exam.findFirst({
    where: { id },
    select: { id: true, userId: true, content: true, isPublic: true },
  });

  if (!row) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
        <div className="space-y-3">
          <p className="text-sm text-red-800">ไม่พบข้อสอบ</p>
          <Link href="/exam" className="text-sm font-medium text-brand underline hover:text-brand-hover">
            ← กลับไปหน้าข้อสอบ
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = row.userId === userId;
  if (!row.isPublic && !isOwner) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
        <div className="space-y-3">
          <p className="text-sm text-red-800">ไม่พบเฉลยข้อสอบ</p>
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
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{parsed.error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
      <ExamAnswerView examId={id} exam={parsed.exam} />
    </div>
  );
}
