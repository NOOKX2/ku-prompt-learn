import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { ExamDetailView } from "@/components/exam/exam-detail-view";
import { resolveExamFromContent } from "@/lib/exam-stored-content";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "ข้อสอบ",
    description: `ทำข้อสอบที่บันทึก — ${id.slice(0, 8)}…`,
  };
}

export default async function ExamByIdPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const row = await prisma.exam.findFirst({
    where: { id },
    select: { id: true, userId: true, title: true, score: true, content: true, isPublic: true, createdAt: true },
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

  const isOwner = userId === row.userId;

  // Private exam: only owner can view
  if (!row.isPublic && !isOwner) {
    if (!userId) {
      return (
        <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
          <p className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
            <Link href="/login" className="font-medium text-brand underline hover:text-brand-hover">
              เข้าสู่ระบบ
            </Link>{" "}
            เพื่อเปิดข้อสอบนี้
          </p>
        </div>
      );
    }
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

  const parse = resolveExamFromContent(row.content);

  if (!parse.ok) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
        <div className="space-y-3">
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{parse.error}</p>
          <Link href="/exam" className="text-sm font-medium text-brand underline hover:text-brand-hover">
            ← กลับไปหน้าข้อสอบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
      <ExamDetailView
        examRecordId={row.id}
        title={row.title}
        createdAtIso={row.createdAt.toISOString()}
        scorePercent={row.score}
        exam={parse.exam}
        isOwner={isOwner}
        isPublic={row.isPublic}
      />
    </div>
  );
}
