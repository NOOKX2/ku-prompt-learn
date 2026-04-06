"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { downloadDifyAnswerAsPdf } from "@/lib/dify-answer-pdf";
import { extractTextFromPdfFile } from "@/lib/extract-pdf-text";
import {
  getTemplateById,
  promptTemplates,
  type PromptTemplate,
} from "@/lib/prompt-templates";

function defaultValues(t: PromptTemplate): Record<string, string> {
  const o: Record<string, string> = {};
  for (const f of t.fields) {
    if (f.type === "select" && f.options?.length) {
      o[f.key] = f.options[0].value;
    } else {
      o[f.key] = "";
    }
  }
  return o;
}

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-black outline-none transition placeholder:text-neutral-400 focus:border-brand focus:ring-2 focus:ring-[var(--brand-ring)]";

const TEXT_FILE_ACCEPT =
  ".txt,.md,.csv,.json,.log,.tex,.pdf,text/plain,text/markdown,text/csv,application/json,application/pdf";
const MAX_TEXT_IMPORT_BYTES = 1024 * 1024;
const MAX_PDF_IMPORT_BYTES = 8 * 1024 * 1024;

function isPdfFile(file: File): boolean {
  const n = file.name.toLowerCase();
  return n.endsWith(".pdf") || file.type === "application/pdf";
}

function readFileAsUtf8Text(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.readAsText(file, "UTF-8");
  });
}

export function PromptStudio() {
  const [templateId, setTemplateId] = useState(promptTemplates[0].id);
  const template = useMemo(
    () => getTemplateById(templateId) ?? promptTemplates[0],
    [templateId],
  );

  const [values, setValues] = useState<Record<string, string>>(() =>
    defaultValues(promptTemplates[0]),
  );

  const handleSelectTemplate = (id: string) => {
    setTemplateId(id);
    const next = getTemplateById(id);
    if (next) setValues(defaultValues(next));
    setFileImportError(null);
  };

  const setField = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const promptText = useMemo(() => {
    try {
      return template.buildPrompt(values);
    } catch {
      return "";
    }
  }, [template, values]);

  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfExportError, setPdfExportError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const run = useCallback(async () => {
    const p = promptText.trim();
    if (!p) return;

    setError(null);
    setPdfExportError(null);
    setAnswer("");
    setLoading(true);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p }),
        signal: ac.signal,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          hint?: string;
          difyCode?: string;
        };
        const parts = [
          data.error && data.difyCode
            ? `${data.error} (${data.difyCode})`
            : data.error,
          data.hint,
        ].filter(Boolean);
        throw new Error(
          parts.join("\n\n") || `ขอล้มเหลว (${res.status})`,
        );
      }

      if (!res.body) {
        throw new Error("ไม่ได้รับสตรีมจากเซิร์ฟเวอร์");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setAnswer(accumulated);
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        setError("หยุดแล้ว");
      } else {
        setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [promptText]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [fileImportError, setFileImportError] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleTextareaFile = useCallback(
    async (fieldKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const file = input.files?.[0];
      input.value = "";
      if (!file) return;
      setFileImportError(null);

      if (isPdfFile(file)) {
        if (file.size > MAX_PDF_IMPORT_BYTES) {
          setFileImportError("PDF ใหญ่เกิน 8 MB — โปรดแบ่งหรือบีบอัดไฟล์ก่อน");
          return;
        }
        try {
          const text = await extractTextFromPdfFile(file);
          if (!text.trim()) {
            setFileImportError(
              "ดึงข้อความจาก PDF ไม่ได้ — อาจเป็นไฟล์สแกนรูปหรือมีการป้องกันการคัดลอก",
            );
            return;
          }
          setValues((prev) => ({ ...prev, [fieldKey]: text }));
        } catch (err) {
          setFileImportError(
            err instanceof Error ? err.message : "อ่าน PDF ไม่สำเร็จ",
          );
        }
        return;
      }

      if (file.size > MAX_TEXT_IMPORT_BYTES) {
        setFileImportError("ไฟล์ข้อความใหญ่เกิน 1 MB — โปรดแบ่งหรือย่อข้อความก่อน");
        return;
      }
      try {
        const text = await readFileAsUtf8Text(file);
        setValues((prev) => ({ ...prev, [fieldKey]: text }));
      } catch (err) {
        setFileImportError(
          err instanceof Error ? err.message : "นำเข้าไฟล์ไม่สำเร็จ",
        );
      }
    },
    [],
  );

  const copyPrompt = useCallback(async () => {
    await navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    window.setTimeout(() => setCopiedPrompt(false), 2000);
  }, [promptText]);

  const copyAnswer = useCallback(async () => {
    await navigator.clipboard.writeText(answer);
    setCopiedAnswer(true);
    window.setTimeout(() => setCopiedAnswer(false), 2000);
  }, [answer]);

  const downloadPdf = useCallback(async () => {
    if (!answer.trim()) return;
    setPdfExportError(null);
    setDownloadingPdf(true);
    try {
      await downloadDifyAnswerAsPdf(answer);
    } catch (e) {
      setPdfExportError(
        e instanceof Error ? e.message : "สร้าง PDF ไม่สำเร็จ",
      );
    } finally {
      setDownloadingPdf(false);
    }
  }, [answer]);

  return (
    <div className="flex flex-col gap-10 text-black xl:flex-row xl:items-start xl:gap-8">
      <div className="min-w-0 flex-1 space-y-6 xl:max-w-xl">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            เลือกเครื่องมือ
          </p>
          <div
            className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
            role="tablist"
            aria-label="ประเภทเทมเพลต"
          >
            {promptTemplates.map((t) => {
              const selected = t.id === templateId;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => handleSelectTemplate(t.id)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                    selected
                      ? "border-brand bg-brand-muted text-black ring-1 ring-brand/25"
                      : "border-gray-200 bg-white text-neutral-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`font-semibold ${selected ? "text-brand" : "text-black"}`}
                  >
                    {t.shortTitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-sm leading-relaxed text-black">
          {template.description}
        </p>

        <div className="space-y-5">
          {fileImportError ? (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
              {fileImportError}
            </p>
          ) : null}
          {template.fields
            .filter(
              (f) =>
                !f.showWhen ||
                values[f.showWhen.field] === f.showWhen.value,
            )
            .map((f) => (
            <div key={f.key}>
              <label
                htmlFor={f.key}
                className="mb-1.5 block text-sm font-medium text-black"
              >
                {f.label}
                {f.required ? (
                  <span className="text-red-600"> *</span>
                ) : null}
              </label>
              {f.type === "textarea" ? (
                <div className="space-y-2">
                  <textarea
                    id={f.key}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    rows={f.key === "material" ? 6 : 4}
                    className={`${inputClass} resize-y`}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={(el) => {
                        fileInputRefs.current[f.key] = el;
                      }}
                      type="file"
                      id={`${f.key}-file`}
                      className="sr-only"
                      accept={TEXT_FILE_ACCEPT}
                      aria-label={`นำเข้าข้อความจากไฟล์สำหรับ ${f.label}`}
                      onChange={(e) => void handleTextareaFile(f.key, e)}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[f.key]?.click()}
                      className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition hover:border-gray-300 hover:bg-gray-50"
                    >
                      นำเข้าจากไฟล์
                    </button>
                    <span className="text-xs text-neutral-500">
                      .txt / .md / .csv / .json (UTF-8) สูงสุด 1 MB · PDF สูงสุด 8 MB
                      (ดึงเฉพาะข้อความที่เลือกได้ — ไฟล์สแกนอาจว่าง) — แทนที่ข้อความในช่องนี้
                    </span>
                  </div>
                </div>
              ) : f.type === "select" ? (
                <select
                  id={f.key}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                  className={inputClass}
                >
                  {(f.options ?? []).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={f.key}
                  type="text"
                  value={values[f.key] ?? ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className={inputClass}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4 xl:sticky xl:top-24 xl:max-w-none">
        <div className="flex flex-col overflow-hidden rounded-2xl border-2 border-black/10 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 px-4 py-3">
            <span className="font-mono text-xs font-medium uppercase tracking-wide text-neutral-600">
              คำสั่ง → โมเดล
            </span>
            <button
              type="button"
              onClick={() => void copyPrompt()}
              className="rounded-lg border border-black/15 px-2.5 py-1.5 font-mono text-[11px] font-medium text-black hover:bg-neutral-50"
            >
              {copiedPrompt ? "คัดลอกแล้ว" : "คัดลอกคำสั่ง"}
            </button>
          </div>
          <pre className="max-h-[32vh] min-h-[120px] overflow-auto whitespace-pre-wrap wrap-break-word bg-neutral-50 p-4 font-mono text-[11px] leading-relaxed sm:text-xs">
            {promptText || "—"}
          </pre>
          <div className="flex flex-wrap gap-2 border-t border-black/10 p-3">
            <button
              type="button"
              disabled={loading || !promptText.trim()}
              onClick={() => void run()}
              className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
            >
              {loading ? "กำลังรัน…" : "รันคำสั่ง"}
            </button>
            {loading ? (
              <button
                type="button"
                onClick={stop}
                className="rounded-xl border-2 border-black px-4 py-2.5 text-sm font-medium hover:bg-neutral-50"
              >
                หยุด
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex min-h-[200px] flex-col overflow-hidden rounded-2xl border-2 border-black bg-white">
          <div className="flex flex-col gap-2 border-b border-black px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-medium uppercase tracking-wide text-brand">
                คำตอบ (Dify)
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!answer || downloadingPdf}
                  onClick={() => void downloadPdf()}
                  className="rounded-lg border border-black/15 px-2.5 py-1.5 font-mono text-[11px] font-medium hover:bg-neutral-50 disabled:opacity-40"
                >
                  {downloadingPdf ? "กำลังสร้าง PDF…" : "ดาวน์โหลด PDF"}
                </button>
                <button
                  type="button"
                  disabled={!answer}
                  onClick={() => void copyAnswer()}
                  className="rounded-lg border border-black/15 px-2.5 py-1.5 font-mono text-[11px] font-medium hover:bg-neutral-50 disabled:opacity-40"
                >
                  {copiedAnswer ? "คัดลอกแล้ว" : "คัดลอกคำตอบ"}
                </button>
              </div>
            </div>
            {pdfExportError ? (
              <p className="text-xs text-red-700">{pdfExportError}</p>
            ) : null}
          </div>
          {error ? (
            <p className="whitespace-pre-wrap p-4 text-sm leading-relaxed text-red-700">
              {error}
            </p>
          ) : (
            <pre className="max-h-[min(55vh,520px)] min-h-[180px] flex-1 overflow-auto whitespace-pre-wrap wrap-break-word p-4 font-mono text-[11px] leading-relaxed text-black sm:text-xs">
              {answer || (loading ? "…" : "กด «รันคำสั่ง» เพื่อให้โมเดลตอบในหน้านี้")}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
