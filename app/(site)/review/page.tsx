import type { Metadata } from "next";
import { ReviewPlanPageClient } from "@/components/review-plan/review-plan-page-client";

export const metadata: Metadata = {
  title: "ตารางทบทวนบทเรียน",
  description: "ตารางอ่านหนังสือที่สร้างจากสตูดิโอ — คลิกรายการเพื่อดูรายละเอียด",
};

export default function ReviewPlanPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <ReviewPlanPageClient />
    </main>
  );
}

