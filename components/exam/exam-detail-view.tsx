import Link from "next/link";
import type { ExamBundle } from "@/lib/exam-json";
import { ExamRunner } from "./exam-runner";
import { ExamPublishButton } from "./publish-button";

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
  const scoreSafe = Math.max(0, Math.min(100, scorePercent ?? 0));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
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
            <p className="mt-1 text-sm text-neutral-600">
              {[exam.subject, exam.difficulty].filter(Boolean).join(" • ")}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              สร้างเมื่อ{" "}
              {new Date(createdAtIso).toLocaleString("th-TH", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {isOwner ? <ExamPublishButton examId={examRecordId} initialIsPublic={isPublic} /> : null}
            <Link
              href={`/exam/${examRecordId}/answer`}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-neutral-50"
            >
              👁️ ดูเฉลย
            </Link>
            <Link
              href="/exam"
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-neutral-50"
            >
              📄 ดูข้อสอบทั้งหมด
            </Link>
          </div>
        </div>

        {scorePercent != null && isOwner ? (
          <div className="mt-4 space-y-1.5">
            <div className="text-sm font-medium text-black">คะแนนล่าสุด: {scorePercent}%</div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${scoreSafe}%` }} />
            </div>
          </div>
        ) : null}
      </div>

      {/* Non-owners do the exam without saving their score */}
      <ExamRunner exam={exam} examRecordId={isOwner ? examRecordId : undefined} showHeader={false} />
    </div>
  );
}
