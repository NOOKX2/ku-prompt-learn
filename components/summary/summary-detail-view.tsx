import Link from "next/link";
import { JsonAnswerFallback } from "@/components/prompt-studio/json-answer-fallback";
import type { JsonValue } from "@/components/prompt-studio/json-answer-summary";
import type { SimplifySummary } from "@/lib/simplify-summary";
import { SummaryContentDisplay } from "./summary-content-display";

type Props = {
  createdAtIso: string;
  parsed: SimplifySummary | null;
  rawContent: unknown;
};

export function SummaryDetailView({ createdAtIso, parsed, rawContent }: Props) {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">รายละเอียดสรุป</p>
          <p className="mt-1 text-xs text-neutral-500">
            บันทึกเมื่อ{" "}
            {new Date(createdAtIso).toLocaleString("th-TH", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <Link
          href="/summary"
          className="shrink-0 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-neutral-50"
        >
          ← รายการสรุปทั้งหมด
        </Link>
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
