import Link from "next/link";
import type { ExamBundle } from "@/lib/exam-json";
import { ExamRunner } from "./exam-runner";

type Props = {
  examRecordId: string;
  title: string;
  createdAtIso: string;
  scorePercent: number | null;
  exam: ExamBundle;
};

export function ExamDetailView({ examRecordId, title, createdAtIso, scorePercent, exam }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">ข้อสอบที่บันทึก</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-black sm:text-2xl">{title}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            สร้างเมื่อ{" "}
            {new Date(createdAtIso).toLocaleString("th-TH", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            {scorePercent != null ? (
              <span className="ml-2 font-medium text-brand">คะแนนล่าสุด {scorePercent}%</span>
            ) : null}
          </p>
        </div>
        <Link href="/exam" className="text-sm font-medium text-brand underline hover:text-brand-hover">
          ดูข้อสอบทั้งหมด
        </Link>
      </div>

      <ExamRunner exam={exam} examRecordId={examRecordId} />
    </div>
  );
}
