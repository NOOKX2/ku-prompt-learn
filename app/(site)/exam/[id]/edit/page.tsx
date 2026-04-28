import type { Metadata } from "next";
import { ExamEditClient } from "../../components/exam-edit-client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "แก้ไขข้อสอบ",
    description: `แก้ไขชีทข้อสอบ — ${id.slice(0, 8)}…`,
  };
}

export default async function ExamEditPage({ params }: Props) {
  const { id } = await params;
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
      <ExamEditClient examId={id} />
    </main>
  );
}
