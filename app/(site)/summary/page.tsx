import type { Metadata } from "next";
import { SummaryPageClient } from "@/components/summary/summary-page-client";

export const metadata: Metadata = {
  title: "รายการสรุปทั้งหมด",
  description: "สรุปที่บันทึกจากสตูดิโอ — เปิดดูรายละเอียดแต่ละรายการ",
};

export default function SummaryPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <SummaryPageClient />
    </main>
  );
}
