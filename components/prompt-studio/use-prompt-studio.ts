"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { downloadDifyAnswerAsPdf } from "@/lib/dify-answer-pdf";
import { getTemplateById, promptTemplates } from "@/lib/prompt-templates";
import {
  appendAttachmentNoticeToPrompt,
  collectAttachmentsInFieldOrder,
  defaultValues,
} from "./helpers";
import { streamGenerate } from "./generate-client";
import { useFileHandlers } from "./use-file-handlers";
import { useClipboardFeedback } from "./use-clipboard-feedback";

type UiState = {
  fileImportError: string | null;
  pdfExportError: string | null;
  downloadingPdf: boolean;
};

export function usePromptStudio() {
  const [templateId, setTemplateId] = useState(promptTemplates[0].id);
  const template = useMemo(
    () => getTemplateById(templateId) ?? promptTemplates[0],
    [templateId],
  );
  const [values, setValues] = useState<Record<string, string>>(() => defaultValues(promptTemplates[0]));
  const [fieldAttachments, setFieldAttachments] = useState<Record<string, File[]>>({});
  const [ui, setUi] = useState<UiState>({
    fileImportError: null,
    pdfExportError: null,
    downloadingPdf: false,
  });
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  /** Always read latest attachments inside async run() (avoids stale closure if run fires before state commit). */
  const fieldAttachmentsRef = useRef(fieldAttachments);
  fieldAttachmentsRef.current = fieldAttachments;
  const promptClipboard = useClipboardFeedback();
  const answerClipboard = useClipboardFeedback();

  const promptText = useMemo(() => {
    try {
      const base = template.buildPrompt(values);
      const { meta } = collectAttachmentsInFieldOrder(template, fieldAttachments);
      return appendAttachmentNoticeToPrompt(base, meta);
    } catch {
      return "";
    }
  }, [template, values, fieldAttachments]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const selectTemplate = useCallback((id: string) => {
    setTemplateId(id);
    const next = getTemplateById(id);
    if (next) setValues(defaultValues(next));
    setFieldAttachments({});
    setUi((prev) => ({ ...prev, fileImportError: null }));
  }, []);

  const setField = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const run = useCallback(async () => {
    const p = promptText.trim();
    if (!p) return;
    setError(null);
    setUi((prev) => ({ ...prev, pdfExportError: null }));
    setAnswer("");
    setLoading(true);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      await streamGenerate({
        prompt: p,
        template,
        fieldAttachments: fieldAttachmentsRef.current,
        signal: ac.signal,
        onChunk: setAnswer,
      });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") setError("หยุดแล้ว");
      else setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [promptText, template]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const copyPrompt = useCallback(async () => {
    await promptClipboard.copy(promptText);
  }, [promptClipboard, promptText]);

  const copyAnswer = useCallback(async () => {
    await answerClipboard.copy(answer);
  }, [answer, answerClipboard]);

  const downloadPdf = useCallback(async () => {
    if (!answer.trim()) return;
    setUi((prev) => ({ ...prev, pdfExportError: null, downloadingPdf: true }));
    try {
      await downloadDifyAnswerAsPdf(answer);
    } catch (e) {
      setUi((prev) => ({
        ...prev,
        pdfExportError: e instanceof Error ? e.message : "สร้าง PDF ไม่สำเร็จ",
      }));
    } finally {
      setUi((prev) => ({ ...prev, downloadingPdf: false }));
    }
  }, [answer]);

  const {
    textFileInputRefs,
    attachInputRefs,
    removeAttachment,
    handleTextFileImport,
    handleAttachFiles,
  } = useFileHandlers({
    setValues,
    setFieldAttachments,
    setFileImportError: (message) =>
      setUi((prev) => ({ ...prev, fileImportError: message })),
  });

  return {
    templateId, template, values, fieldAttachments, promptText, answer, loading, error,
    ui,
    clipboard: {
      copiedPrompt: promptClipboard.copied,
      copiedAnswer: answerClipboard.copied,
    },
    textFileInputRefs, attachInputRefs,
    selectTemplate, setField, run, stop, copyPrompt, copyAnswer, downloadPdf,
    handleTextFileImport, handleAttachFiles, removeAttachment,
  };
}
