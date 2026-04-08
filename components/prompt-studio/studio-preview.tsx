"use client";

import { useMemo } from "react";

type Props = {
  promptText: string;
  answer: string;
  loading: boolean;
  error: string | null;
  copiedPrompt: boolean;
  copiedAnswer: boolean;
  downloadingPdf: boolean;
  pdfExportError: string | null;
  onCopyPrompt: () => void;
  onRun: () => void;
  onStop: () => void;
  onDownloadPdf: () => void;
  onCopyAnswer: () => void;
};

type PromptSection = { title: string; body: string };

function parsePromptSections(raw: string): { intro: string; sections: PromptSection[] } {
  const parts = raw.split(/\n(?=## )/);
  const intro = (parts[0] ?? "").trim();
  const sections: PromptSection[] = [];
  for (let i = 1; i < parts.length; i++) {
    const lines = (parts[i] ?? "").split("\n");
    const first = lines[0] ?? "";
    if (!first.startsWith("## ")) continue;
    const title = first.slice(3).trim();
    const body = lines.slice(1).join("\n").trim();
    sections.push({ title, body });
  }
  return { intro, sections };
}

function PromptReadableView({ text }: { text: string }) {
  const { intro, sections } = useMemo(() => parsePromptSections(text), [text]);
  const hasStructure = sections.length > 0;

  if (!text.trim()) {
    return (
      <p className="text-sm text-neutral-500">
        กรอกฟอร์มด้านซ้าย — คำสั่งที่สร้างจากเทมเพลตจะแสดงที่นี่
      </p>
    );
  }

  if (!hasStructure) {
    return (
      <div className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word text-neutral-900">
        {text}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {intro ? (
        <p className="rounded-xl border border-neutral-200/90 bg-white px-4 py-3 text-[15px] font-medium leading-[1.65] text-neutral-900 shadow-sm">
          {intro}
        </p>
      ) : null}
      <div className="space-y-3">
        {sections.map((s, idx) => (
          <section
            key={`${idx}-${s.title}`}
            className="overflow-hidden rounded-xl border border-neutral-200/90 bg-linear-to-b from-white to-neutral-50/90 shadow-sm"
          >
            <h3 className="border-b border-brand/15 bg-brand-muted/80 px-4 py-2.5 text-sm font-semibold text-brand">
              {s.title}
            </h3>
            <div className="max-h-[28vh] overflow-auto px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap wrap-break-word text-neutral-800 [scrollbar-gutter:stable] sm:max-h-[36vh]">
              {s.body || "—"}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function StudioPreview(props: Props) {
  const {
    promptText, answer, loading, error, copiedPrompt, copiedAnswer, downloadingPdf, pdfExportError,
    onCopyPrompt, onRun, onStop, onDownloadPdf, onCopyAnswer,
  } = props;

  const subjectMissing = promptText.includes('รายวิชา ""');
  const charCount = promptText.length;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5 xl:sticky xl:top-20 xl:max-w-none">
      <div className="flex flex-col overflow-hidden rounded-2xl border-2 border-black/10 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 bg-linear-to-r from-brand-muted/50 to-white px-4 py-3">
          <div className="min-w-0 space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand">คำสั่งที่จะส่งไปยังโมเดล</span>
            <p className="text-xs text-neutral-600">
              แบ่งเป็นหัวข้อให้อ่านง่าย — ข้อความนี้คือสิ่งที่ระบบส่งไป Dify ตอนกดรัน
              {charCount > 0 ? (
                <span className="text-neutral-500">
                  {" "}
                  · <span className="font-mono tabular-nums">{charCount.toLocaleString("th-TH")}</span> ตัวอักษร
                </span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            onClick={onCopyPrompt}
            className="shrink-0 rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-medium text-black shadow-sm hover:bg-neutral-50"
          >
            {copiedPrompt ? "คัดลอกแล้ว" : "คัดลอกข้อความทั้งก้อน"}
          </button>
        </div>

        {subjectMissing ? (
          <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <span className="font-semibold">ยังไม่ได้ระบุชื่อรายวิชา</span>
            <span className="text-amber-900">
              {" "}
              — กรอกช่อง «รายวิชา / หัวข้อ» ทางซ้ายเพื่อไม่ให้คำสั่งมีเครื่องหมายคำพูดว่าง{" "}
              <code className="rounded bg-amber-100/80 px-1 font-mono text-xs">""</code>
            </span>
          </div>
        ) : null}

        <div className="max-h-[min(52vh,560px)] min-h-[160px] overflow-auto bg-neutral-50/50 p-4 [scrollbar-gutter:stable] sm:p-5">
          <PromptReadableView text={promptText} />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-black/10 bg-white px-4 py-3">
          <button
            type="button"
            disabled={loading || !promptText.trim()}
            onClick={onRun}
            className="min-h-11 flex-1 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:min-w-[140px]"
          >
            {loading ? "กำลังรัน…" : "รันคำสั่ง"}
          </button>
          {loading ? (
            <button
              type="button"
              onClick={onStop}
              className="min-h-11 rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            >
              หยุด
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-[200px] flex-col overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col gap-2 border-b border-black/10 bg-linear-to-r from-brand-muted/30 to-white px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-brand">คำตอบจากโมเดล</span>
              <p className="mt-0.5 text-xs text-neutral-600">สตรีมจาก Dify แสดงที่นี่</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!answer || downloadingPdf}
                onClick={onDownloadPdf}
                className="rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-neutral-50 disabled:opacity-40"
              >
                {downloadingPdf ? "กำลังสร้าง PDF…" : "ดาวน์โหลด PDF"}
              </button>
              <button
                type="button"
                disabled={!answer}
                onClick={onCopyAnswer}
                className="rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-neutral-50 disabled:opacity-40"
              >
                {copiedAnswer ? "คัดลอกแล้ว" : "คัดลอกคำตอบ"}
              </button>
            </div>
          </div>
          {pdfExportError ? <p className="text-xs text-red-700">{pdfExportError}</p> : null}
        </div>
        {error ? (
          <p className="whitespace-pre-wrap p-4 text-sm leading-relaxed text-red-700">{error}</p>
        ) : (
          <div className="flex min-h-[180px] flex-1 flex-col">
            {!answer.trim() && !loading ? (
              <p className="border-b border-neutral-100 bg-neutral-50/80 px-4 py-2 text-xs text-neutral-600 sm:px-5">
                ข้อความด้านล่างเป็นคำแนะนำจากหน้าเว็บ — <strong className="font-medium text-neutral-800">ไม่ใช่คำตอบจาก Dify</strong> จนกว่าจะกดรันและมีข้อความจากโมเดลปรากฏ
              </p>
            ) : null}
            <pre className="max-h-[min(55vh,520px)] min-h-[140px] flex-1 overflow-auto whitespace-pre-wrap wrap-break-word p-4 text-sm leading-relaxed text-neutral-900 sm:p-5 [scrollbar-gutter:stable]">
              {answer || (loading ? "…" : "กด «รันคำสั่ง» เพื่อให้โมเดลตอบในหน้านี้")}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
