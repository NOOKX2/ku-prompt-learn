import type { Metadata } from "next";
import { ReviewPlanEditClient } from "@/components/review-plan/review-plan-edit-client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "แก้ไขตารางทบทวน",
    description: `แก้ไขชีทตารางทบทวน — ${id.slice(0, 8)}…`,
  };
}

export default async function ReviewEditPage({ params }: Props) {
  const { id } = await params;
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
      <ReviewPlanEditClient planId={id} />
    </main>
  );
}
