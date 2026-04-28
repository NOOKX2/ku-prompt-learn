import Link from "next/link";
import { JsonAnswerFallback } from "@/components/prompt-studio/json-answer-fallback";
import type { JsonValue } from "@/components/prompt-studio/json-answer-summary";
import type { SimplifySummary } from "@/lib/simplify-summary";
import { PublishButton } from "@/components/publish-button";
import { SummaryContentDisplay } from "./summary-content-display";

type Props = {
  summaryId: string;
  createdAtIso: string;
  parsed: SimplifySummary | null;
  rawContent: unknown;
  isOwner: boolean;
  isPublic: boolean;
};

export function SummaryDetailView({ summaryId, createdAtIso, parsed, rawContent, isOwner, isPublic }: Props) {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">รายละเอียดสรุป</p>
            {isPublic && !isOwner ? (
              <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                สาธารณะ
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            บันทึกเมื่อ{" "}
            {new Date(createdAtIso).toLocaleString("th-TH", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {isOwner ? (
            <PublishButton
              patchUrl={`/api/summaries/${summaryId}`}
              sharePath={`/summary/${summaryId}`}
              initialIsPublic={isPublic}
            />
          ) : null}
          <Link
            href="/summary"
            className="shrink-0 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-neutral-50"
          >
            ← รายการสรุปทั้งหมด
          </Link>
        </div>
      </div>

      {parsed ? (
        <SummaryContentDisplay data={parsed} />
      ) : (
        <div className="space-y-4">
          <p className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
            โครงสร้างสรุปนี้ไม่ตรงรูปแบบที่แสดงแบบการ์ด — แสดง JSON ดิบแทน
          </p>
          <JsonAnswerFallback data={rawContent as JsonValue} />
        </div>
      )}
    </div>
  );
}
