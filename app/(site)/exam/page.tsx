import type { Metadata } from "next";
import { ExamPageClient } from "@/components/exam/exam-page-client";

export const metadata: Metadata = {
  title: "รายการข้อสอบทั้งหมด",
  description: "แสดงรายการข้อสอบที่สร้างจาก Dify และเปิดทำรายชุดที่หน้า /exam/[id]",
};

export default function ExamPage() {
  return <ExamPageClient />;
}
