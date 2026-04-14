import type { Metadata } from "next";
import { ExamDetailClient } from "@/components/exam/exam-detail-client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "ข้อสอบ",
    description: `ทำข้อสอบที่บันทึก — ${id.slice(0, 8)}…`,
  };
}

export default async function ExamByIdPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
      <ExamDetailClient examId={id} />
    </div>
  );
}
