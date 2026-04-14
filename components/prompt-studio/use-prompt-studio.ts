"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DifyUploadedFileRef } from "@/lib/dify/types";
import { downloadDifyAnswerAsPdf } from "@/lib/dify-answer-pdf";
import { getTemplateById, promptTemplates } from "@/lib/prompt-templates";
import { useGenerateStream } from "@/hooks/use-generate-stream";
import {
  stripAllKuImportBlocks,
  type ImportSlot,
} from "@/components/prompt-studio/import-blocks";
import {
  appendDifyWorkflowUploadedPdfHint,
  appendRagPdfReferenceHint,
  collectPdfAttachmentMeta,
  defaultValues,
  primaryAttachmentFieldKey,
} from "./helpers";
import { useFileHandlers, type ImportEntry } from "./use-file-handlers";
import { useClipboardFeedback } from "./use-clipboard-feedback";

type UiState = {
  fileImportError: string | null;
  pdfExportError: string | null;
  downloadingPdf: boolean;
  pdfImportBusy: boolean;
};

export function usePromptStudio() {
  const { data: session, status: sessionStatus } = useSession();
  const [templateId, setTemplateId] = useState(promptTemplates[0].id);
  const template = useMemo(
    () => getTemplateById(templateId) ?? promptTemplates[0],
    [templateId],
  );
  const attachmentFieldKey = useMemo(() => primaryAttachmentFieldKey(template), [template]);
  const [values, setValues] = useState<Record<string, string>>(() => defaultValues(promptTemplates[0]));
  const [fieldAttachments, setFieldAttachments] = useState<Record<string, File[]>>({});
  const [importSlots, setImportSlots] = useState<ImportSlot[]>([]);
  const [importBodies, setImportBodies] = useState<Record<string, string>>({});
  const importSlotsRef = useRef(importSlots);
  importSlotsRef.current = importSlots;
  const [pdfHandling, setPdfHandling] = useState<"upload" | "extract">("extract");
  const [knowledgeUploadEnabled, setKnowledgeUploadEnabled] = useState(false);
  const [ui, setUi] = useState<UiState>({
    fileImportError: null,
    pdfExportError: null,
    downloadingPdf: false,
    pdfImportBusy: false,
  });
  const fieldAttachmentsRef = useRef(fieldAttachments);
  fieldAttachmentsRef.current = fieldAttachments;

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/studio-config")
      .then((r) => r.json())
      .then((d: { pdfHandling?: string; knowledgeUploadEnabled?: boolean }) => {
        if (cancelled) return;
        setPdfHandling(d.pdfHandling === "upload" ? "upload" : "extract");
        setKnowledgeUploadEnabled(Boolean(d.knowledgeUploadEnabled));
      })
      .catch(() => {
        if (!cancelled) {
          setPdfHandling("extract");
          setKnowledgeUploadEnabled(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const promptClipboard = useClipboardFeedback();
  const answerClipboard = useClipboardFeedback();

  const {
    answer,
    loading,
    error,
    run: runStream,
    stop,
  } = useGenerateStream();

  /** รวมข้อความที่พิมพ์ในช่องอ้างอิง + เนื้อหาจากไฟล์ที่นำเข้า (ไม่แสดงยาวใน textarea) */
  const valuesForPrompt = useMemo(() => {
    const key = attachmentFieldKey;
    if (!key) return values;
    const raw = values[key] ?? "";
    const userTyped = stripAllKuImportBlocks(raw).trimEnd();
    const importedParts = importSlots
      .filter((s) => s.fieldKey === key)
      .map((s) => importBodies[s.id])
      .filter((b): b is string => Boolean(b && b.trim()));
    const merged = [userTyped, ...importedParts].filter(Boolean).join("\n\n---\n\n");
    return { ...values, [key]: merged };
  }, [values, importSlots, importBodies, attachmentFieldKey]);

  const promptBase = useMemo(() => {
    try {
      return template.buildPrompt(valuesForPrompt);
    } catch {
      return "";
    }
  }, [template, valuesForPrompt]);

  const promptText = useMemo(() => {
    const meta = collectPdfAttachmentMeta(template, fieldAttachments);
    return appendRagPdfReferenceHint(promptBase, meta);
  }, [template, fieldAttachments, promptBase]);

  const selectTemplate = useCallback((id: string) => {
    setTemplateId(id);
    const next = getTemplateById(id);
    if (next) setValues(defaultValues(next));
    setFieldAttachments({});
    setImportSlots([]);
    setImportBodies({});
    setUi((prev) => ({ ...prev, fileImportError: null }));
  }, []);

  const registerImports = useCallback((entries: ImportEntry[]) => {
    if (entries.length === 0) return;
    setImportSlots((prev) => [...prev, ...entries.map((e) => e.slot)]);
    setImportBodies((prev) => {
      const next = { ...prev };
      for (const e of entries) next[e.slot.id] = e.body;
      return next;
    });
  }, []);

  const removeImportSlot = useCallback((id: string) => {
    const target = importSlotsRef.current.find((s) => s.id === id);
    if (!target) return;

    setImportBodies((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    if (target.kind === "pdf-rag" && target.ragFile) {
      const fk = target.fieldKey;
      const rf = target.ragFile;
      setFieldAttachments((fp) => {
        const list = [...(fp[fk] ?? [])];
        const idx = list.findIndex((f) => f === rf);
        if (idx >= 0) list.splice(idx, 1);
        const next = { ...fp };
        if (list.length) next[fk] = list;
        else delete next[fk];
        return next;
      });
    }

    setImportSlots((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const getFieldAttachmentCount = useCallback((fieldKey: string) => {
    return fieldAttachmentsRef.current[fieldKey]?.length ?? 0;
  }, []);

  const setField = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const run = useCallback(async () => {
    const p = promptText.trim();
    if (!p) return;
    setUi((prev) => ({ ...prev, pdfExportError: null }));
    const meta = collectPdfAttachmentMeta(template, fieldAttachmentsRef.current);
    let promptToSend = appendRagPdfReferenceHint(promptBase, meta);
    const workflowFiles: DifyUploadedFileRef[] = importSlotsRef.current
      .filter((s) => s.kind === "pdf-dify-upload" && Boolean(s.uploadFileId?.trim()))
      .map((s) => ({
        type: "document" as const,
        transfer_method: "local_file" as const,
        upload_file_id: s.uploadFileId as string,
      }));
    if (workflowFiles.length > 0) {
      const uploadNames = importSlotsRef.current
        .filter((s) => s.kind === "pdf-dify-upload")
        .map((s) => s.fileName);
      promptToSend = appendDifyWorkflowUploadedPdfHint(promptToSend, uploadNames);
    }
    const finalText = await runStream(
      promptToSend,
      workflowFiles.length > 0 ? workflowFiles : undefined,
    );

    if (
      sessionStatus === "authenticated" &&
      session?.user?.id &&
      templateId === "mock-exam" &&
      finalText?.trim()
    ) {
      try {
        await fetch("/api/exams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawAnswer: finalText }),
        });
      } catch {
        /* บันทึกข้อสอบไม่บังคับ — ไม่รบกวนการใช้สตูดิโอ */
      }
    }
  }, [promptText, promptBase, template, runStream, templateId, session?.user?.id, sessionStatus]);

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

  const { unifiedFileInputRef, handleUnifiedFiles } = useFileHandlers({
    setFieldAttachments,
    setFileImportError: (message) =>
      setUi((prev) => ({ ...prev, fileImportError: message })),
    setPdfImportBusy: (busy) =>
      setUi((prev) => ({ ...prev, pdfImportBusy: busy })),
    registerImports,
    getFieldAttachmentCount,
    pdfHandling,
    knowledgeUploadEnabled,
  });

  return {
    templateId,
    template,
    attachmentFieldKey,
    values,
    fieldAttachments,
    importSlots,
    pdfHandling,
    knowledgeUploadEnabled,
    promptText,
    answer,
    loading,
    error,
    ui,
    clipboard: {
      copiedPrompt: promptClipboard.copied,
      copiedAnswer: answerClipboard.copied,
    },
    unifiedFileInputRef,
    selectTemplate,
    setField,
    run,
    stop,
    copyPrompt,
    copyAnswer,
    downloadPdf,
    handleUnifiedFiles,
    removeImportSlot,
  };
}
