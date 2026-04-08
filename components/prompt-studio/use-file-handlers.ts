import { useCallback, useRef } from "react";
import { MAX_ATTACH_BYTES, MAX_ATTACH_PER_FIELD, MAX_TEXT_IMPORT_BYTES } from "./constants";
import { formatBytes, isTextImportFile, readFileAsUtf8Text } from "./helpers";

type Args = {
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setFieldAttachments: React.Dispatch<React.SetStateAction<Record<string, File[]>>>;
  setFileImportError: (message: string | null) => void;
};

export function useFileHandlers(args: Args) {
  const { setValues, setFieldAttachments, setFileImportError } = args;
  const textFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const attachInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const removeAttachment = useCallback((fieldKey: string, index: number) => {
    setFieldAttachments((prev) => {
      const list = [...(prev[fieldKey] ?? [])];
      list.splice(index, 1);
      const next = { ...prev };
      if (list.length) next[fieldKey] = list;
      else delete next[fieldKey];
      return next;
    });
  }, [setFieldAttachments]);

  const handleTextFileImport = useCallback(async (fieldKey: string, files: FileList | null) => {
    if (!files?.length) return;
    setFileImportError(null);
    const arr = Array.from(files);
    for (const file of arr) {
      if (!isTextImportFile(file)) {
        setFileImportError("ช่องนี้รับเฉพาะไฟล์ข้อความ (.txt, .md, .json ฯลฯ) — ใช้ «แนบ PDF/รูป» สำหรับ PDF");
        return;
      }
      if (file.size > MAX_TEXT_IMPORT_BYTES) {
        setFileImportError(`ไฟล์ "${file.name}" ใหญ่เกิน 1 MB — โปรดแบ่งหรือย่อข้อความก่อน`);
        return;
      }
    }
    try {
      const chunks = await Promise.all(arr.map((f) => readFileAsUtf8Text(f)));
      const combined = chunks.join("\n\n---\n\n");
      setValues((prev) => {
        const prevText = prev[fieldKey] ?? "";
        const nextText = prevText.trim() ? `${prevText.trim()}\n\n---\n\n${combined}` : combined;
        return { ...prev, [fieldKey]: nextText };
      });
    } catch (err) {
      setFileImportError(err instanceof Error ? err.message : "นำเข้าไฟล์ไม่สำเร็จ");
    }
  }, [setFileImportError, setValues]);

  const handleAttachFiles = useCallback((fieldKey: string, files: FileList | null) => {
    if (!files?.length) return;
    setFileImportError(null);
    const incoming = Array.from(files);
    for (const file of incoming) {
      if (file.size > MAX_ATTACH_BYTES) {
        setFileImportError(`ไฟล์ "${file.name}" ใหญ่เกิน ${formatBytes(MAX_ATTACH_BYTES)} — Dify จำกัดขนาดไฟล์`);
        return;
      }
    }
    let overLimit = false;
    setFieldAttachments((prev) => {
      const cur = prev[fieldKey] ?? [];
      if (cur.length + incoming.length > MAX_ATTACH_PER_FIELD) {
        overLimit = true;
        return prev;
      }
      return { ...prev, [fieldKey]: [...cur, ...incoming] };
    });
    if (overLimit) setFileImportError(`แนบได้ไม่เกิน ${MAX_ATTACH_PER_FIELD} ไฟล์ต่อช่อง`);
  }, [setFieldAttachments, setFileImportError]);

  return {
    textFileInputRefs,
    attachInputRefs,
    removeAttachment,
    handleTextFileImport,
    handleAttachFiles,
  };
}
