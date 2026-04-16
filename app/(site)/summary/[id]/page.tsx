import type { Metadata } from "next";
import { SummaryDetailClient } from "@/components/summary/summary-detail-client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "รายละเอียดสรุป",
    description: `สรุปที่บันทึก — ${id.slice(0, 8)}…`,
  };
}

export default async function SummaryByIdPage({ params }: Props) {
  const { id } = await params;
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
      <SummaryDetailClient summaryId={id} />
    </main>
  );
}
