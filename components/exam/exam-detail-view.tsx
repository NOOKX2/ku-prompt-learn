import Link from "next/link";
import type { ExamBundle } from "@/lib/exam-json";
import { ExamRunner } from "./exam-runner";
import { PublishButton } from "./publish-button";

type Props = {
  examRecordId: string;
  title: string;
  createdAtIso: string;
  scorePercent: number | null;
  exam: ExamBundle;
  isOwner: boolean;
  isPublic: boolean;
};

export function ExamDetailView({
  examRecordId,
  title,
  createdAtIso,
  scorePercent,
  exam,
  isOwner,
  isPublic,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">ข้อสอบที่บันทึก</p>
            {isPublic && !isOwner ? (
              <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                สาธารณะ
              </span>
            ) : null}
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-black sm:text-2xl">{title}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            สร้างเมื่อ{" "}
            {new Date(createdAtIso).toLocaleString("th-TH", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            {scorePercent != null && isOwner ? (
              <span className="ml-2 font-medium text-brand">คะแนนล่าสุด {scorePercent}%</span>
            ) : null}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {isOwner ? (
            <PublishButton examId={examRecordId} initialIsPublic={isPublic} />
          ) : null}
          <Link href="/exam" className="text-sm font-medium text-brand underline hover:text-brand-hover">
            ดูข้อสอบทั้งหมด
          </Link>
        </div>
      </div>

      {/* Non-owners do the exam without saving their score */}
      <ExamRunner exam={exam} examRecordId={isOwner ? examRecordId : undefined} />
    </div>
  );
}
