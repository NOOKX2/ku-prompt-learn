"use client";

import { useMemo } from "react";
import { parseExamJson } from "@/lib/exam-json";
import { ExamAnswerSummary } from "@/components/prompt-studio/exam-answer-summary";
import { JsonAnswerSummary } from "@/components/prompt-studio/json-answer-summary";
import {
  isLikelyDifyUserPlaceholder,
  isLikelyPromptEcho,
} from "@/components/prompt-studio/prompt-echo";

type Props = {
  templateId?: string;
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
  /** เทมเพลตข้อสอบจำลอง — เปิดหน้าทำข้อสอบจาก JSON */
  canOpenExam?: boolean;
  onOpenExam?: () => void;
};

type PromptSection = { title: string; body: string };
type JsonValue = null | boolean | number | string | JsonValue[] | { [k: string]: JsonValue };

/** ส่วนเนื้อหาอ้างอิงยาว — พับไว้ให้อ่านโครงคำสั่งก่อน */
const COLLAPSE_SECTION_BODY_CHARS = 3500;

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

function parseGenericJson(text: string): JsonValue | null {
  const t = text.trim();
  if (!t) return null;
  try {
    return JSON.parse(t) as JsonValue;
  } catch {
    /* continue */
  }
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(t);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim()) as JsonValue;
    } catch {
      return null;
    }
  }
  return null;
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
        {sections.map((s, idx) => {
          const longBody = (s.body?.length ?? 0) >= COLLAPSE_SECTION_BODY_CHARS;
          const bodyEl = (
            <div className="max-h-[28vh] overflow-auto px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap wrap-break-word text-neutral-800 [scrollbar-gutter:stable] sm:max-h-[36vh]">
              {s.body || "—"}
            </div>
          );
          return (
            <section
              key={`${idx}-${s.title}`}
              className="overflow-hidden rounded-xl border border-neutral-200/90 bg-linear-to-b from-white to-neutral-50/90 shadow-sm"
            >
              {longBody ? (
                <details className="group">
                  <summary className="cursor-pointer list-none border-b border-brand/15 bg-brand-muted/80 px-4 py-2.5 text-sm font-semibold text-brand marker:hidden [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex items-center gap-2">
                      {s.title}
                      <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-neutral-600 ring-1 ring-black/10">
                        แสดงเนื้อหา
                      </span>
                    </span>
                  </summary>
                  {bodyEl}
                </details>
              ) : (
                <>
                  <h3 className="border-b border-brand/15 bg-brand-muted/80 px-4 py-2.5 text-sm font-semibold text-brand">
                    {s.title}
                  </h3>
                  {bodyEl}
                </>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function StudioPreview(props: Props) {
  const {
    templateId,
    promptText, answer, loading, error, copiedPrompt, copiedAnswer, downloadingPdf, pdfExportError,
    onCopyPrompt, onRun, onStop, onDownloadPdf, onCopyAnswer,
    canOpenExam, onOpenExam,
  } = props;

  const subjectMissing = promptText.includes('รายวิชา ""');
  const answerCharCount = answer.length;
  const examParse = useMemo(() => parseExamJson(answer), [answer]);
  const genericJson = useMemo(() => parseGenericJson(answer), [answer]);
  const isMockExamTemplate = templateId === "mock-exam";
  const echoWarning = useMemo(
    () => Boolean(answer.trim() && isLikelyPromptEcho(promptText, answer)),
    [answer, promptText],
  );
  const difyUserOnlyWarning = useMemo(
    () => Boolean(answer.trim() && isLikelyDifyUserPlaceholder(answer)),
    [answer],
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5 xl:sticky xl:top-20 xl:max-w-none">
      <div className="flex flex-col overflow-hidden rounded-2xl border-2 border-black/10 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 bg-linear-to-r from-brand-muted/50 to-white px-4 py-3">
          <div className="min-w-0 space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand">ผลลัพธ์ที่ตอบกลับจาก Dify</span>
            <p className="text-xs text-neutral-600">
              แสดงผลตอบกลับล่าสุดจาก Dify (แบบดิบ)
              {answerCharCount > 0 ? (
                <span className="text-neutral-500">
                  {" "}
                  · <span className="font-mono tabular-nums">{answerCharCount.toLocaleString("th-TH")}</span> ตัวอักษร
                </span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            onClick={onCopyAnswer}
            className="shrink-0 rounded-lg border border-black/15 bg-white px-3 py-2 text-xs font-medium text-black shadow-sm hover:bg-neutral-50"
          >
            {copiedAnswer ? "คัดลอกแล้ว" : "คัดลอกคำตอบ"}
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
          <PromptReadableView
            text={answer || (loading ? "กำลังรอข้อความจาก Dify…" : "กด «รันคำสั่ง» เพื่อให้ Dify ส่งคำตอบกลับ")}
          />
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
              <p className="mt-0.5 text-xs text-neutral-600">
                สตรีมจาก Dify แสดงที่นี่
                {isMockExamTemplate && loading ? (
                  <span className="mt-1 block text-amber-900">
                    ข้อสอบแบบ JSON จำนวนหลายข้ออาจใช้เวลาหลายนาที — รอจนข้อความหยุดเพิ่มหรือกด «หยุด» ได้
                  </span>
                ) : null}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canOpenExam && onOpenExam ? (
                <button
                  type="button"
                  disabled={!answer.trim() || loading}
                  onClick={onOpenExam}
                  className="rounded-lg border border-brand/40 bg-brand-muted px-2.5 py-1.5 text-xs font-semibold text-brand hover:bg-brand-muted/80 disabled:opacity-40"
                >
                  เปิดหน้าทำข้อสอบ
                </button>
              ) : null}
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
          {difyUserOnlyWarning && !loading ? (
            <p className="rounded-lg border border-amber-400 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950">
              <strong>สังเกต:</strong> คำตอบมีเพียงตัวระบุผู้ใช้ (<code className="rounded bg-white/80 px-1">ku-prompt-learn</code>) ไม่ใช่ JSON จากโมเดล — มักเกิดจาก workflow ใน Dify ส่ง output ผิด หรือ PDF สแกน/ใหญ่จนโมเดลไม่ได้เนื้อหา
              ตรวจโหนดสุดท้ายใน Dify และถ้าเป็นรายงานสแกน ให้วางข้อความในช่องอ้างอิงหรือใช้ PDF ที่เลือกข้อความได้
            </p>
          ) : null}
          {echoWarning && !loading ? (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950">
              <strong>สังเกต:</strong> ข้อความด้านล่างตรงกับ «คำสั่งที่ส่งไป» มากผิดปกติ — มักเกิดเมื่อ workflow ใน Dify ต่อ
              <strong> output กับตัวแปร query / input เดิม</strong> แทนผลจากโหนด LLM ให้ตรวจการเชื่อมต่อโหนดสุดท้ายใน Dify
            </p>
          ) : null}
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
            {isMockExamTemplate && loading && answer.trim() ? (
              <p className="border-b border-amber-100 bg-amber-50/60 px-4 py-2 text-xs text-amber-950 sm:px-5">
                กำลังรับข้อความ… ({answer.length.toLocaleString("th-TH")}{" "}
                ตัวอักษร) — ถ้า JSON ยังไม่ครบ สรุปด้านบนจะขึ้นหลังสตรีมจบและ parse ได้
              </p>
            ) : null}
            {examParse.ok ? (
              <>
                <ExamAnswerSummary exam={examParse.exam} />
                <details className="group border-t border-neutral-100">
                  <summary className="cursor-pointer list-none px-4 py-3 text-xs font-medium text-neutral-600 hover:bg-neutral-50 sm:px-5 [&::-webkit-details-marker]:hidden">
                    <span className="text-brand group-open:hidden">แสดงข้อความดิบ (JSON) สำหรับคัดลอก / ส่งต่อ</span>
                    <span className="hidden text-brand group-open:inline">ซ่อนข้อความดิบ</span>
                  </summary>
                  <pre className="max-h-[min(40vh,360px)] overflow-auto border-t border-neutral-100 bg-neutral-50/80 p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap wrap-break-word text-neutral-800 sm:p-5 sm:text-xs [scrollbar-gutter:stable]">
                    {answer}
                  </pre>
                </details>
              </>
            ) : genericJson ? (
              <>
                <JsonAnswerSummary data={genericJson} />
                <details className="group border-t border-neutral-100">
                  <summary className="cursor-pointer list-none px-4 py-3 text-xs font-medium text-neutral-600 hover:bg-neutral-50 sm:px-5 [&::-webkit-details-marker]:hidden">
                    <span className="text-brand group-open:hidden">แสดงข้อความดิบ (JSON) สำหรับคัดลอก / ส่งต่อ</span>
                    <span className="hidden text-brand group-open:inline">ซ่อนข้อความดิบ</span>
                  </summary>
                  <pre className="max-h-[min(40vh,360px)] overflow-auto border-t border-neutral-100 bg-neutral-50/80 p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap wrap-break-word text-neutral-800 sm:p-5 sm:text-xs [scrollbar-gutter:stable]">
                    {answer}
                  </pre>
                </details>
              </>
            ) : (
              <pre className="max-h-[min(55vh,520px)] min-h-[140px] flex-1 overflow-auto whitespace-pre-wrap wrap-break-word p-4 text-sm leading-relaxed text-neutral-900 sm:p-5 [scrollbar-gutter:stable]">
                {answer || (loading ? "…" : "กด «รันคำสั่ง» เพื่อให้โมเดลตอบในหน้านี้")}
              </pre>
            )}
            {examParse.ok === false && answer.trim() && isMockExamTemplate && !loading ? (
              <p className="border-t border-neutral-100 bg-neutral-50/50 px-4 py-2 text-xs text-neutral-600 sm:px-5">
                ยังจัดรูปแบบอ่านง่ายไม่ได้ — {examParse.error}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
