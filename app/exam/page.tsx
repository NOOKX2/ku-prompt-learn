import type { Metadata } from "next";
import { ExamPageClient } from "@/components/exam/exam-page-client";

export const metadata: Metadata = {
  title: "ทำข้อสอบจาก JSON",
  description: "แสดงและทำข้อสอบจาก JSON ที่สร้างจากเทมเพลตข้อสอบจำลองและ Dify",
};

export default function ExamPage() {
  return <ExamPageClient />;
}
