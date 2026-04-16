import { useCallback, useRef } from "react";
import { extractPdfTextFromArrayBuffer } from "@/lib/extract-pdf-text-browser";
import {
  MAX_ATTACH_BYTES,
  MAX_ATTACH_PER_FIELD,
  MAX_PDF_EXTRACT_CHARS,
  MAX_TEXT_IMPORT_BYTES,
  MIN_PDF_EXTRACTED_CHARS,
} from "@/lib/constants";
import type { ImportSlot } from "@/components/prompt-studio/import-blocks";
import {
  formatBytes,
  isPdfFile,
  isTextImportFile,
  readFileAsArrayBuffer,
  readFileAsUtf8Text,
} from "./helpers";

export type { ImportSlot } from "@/components/prompt-studio/import-blocks";

export type ImportEntry = { slot: ImportSlot; body: string };

type Args = {
  setFieldAttachments: React.Dispatch<React.SetStateAction<Record<string, File[]>>>;
  setFileImportError: (message: string | null) => void;
  setPdfImportBusy?: (busy: boolean) => void;
  registerImports: (entries: ImportEntry[]) => void;
  getFieldAttachmentCount: (fieldKey: string) => number;
  /** จาก GET /api/studio-config — upload = ส่ง PDF ไป Dify แทนดึงข้อความในเครื่อง */
  pdfHandling: "upload" | "extract";
  /** มี DIFY_DATASET_ID + DIFY_DATASET_API_KEY — โหมด extract จะเรียก /api/dify-knowledge-upload หลังดึงข้อความ */
  knowledgeUploadEnabled: boolean;
};

function newImportId(): string {
  return crypto.randomUUID();
}

export function useFileHandlers(args: Args) {
  const {
    setFieldAttachments,
    setFileImportError,
    setPdfImportBusy,
    registerImports,
    getFieldAttachmentCount,
    pdfHandling,
    knowledgeUploadEnabled,
  } = args;
  const unifiedFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUnifiedFiles = useCallback(
    async (primaryFieldKey: string, files: FileList | null) => {
      if (!files?.length) return;
      setFileImportError(null);
      const incoming = Array.from(files);
      const entries: ImportEntry[] = [];
      const ragFilesToAdd: File[] = [];

      const pushTextFile = async (file: File) => {
        if (file.size > MAX_TEXT_IMPORT_BYTES) {
          setFileImportError(`ไฟล์ข้อความ "${file.name}" ใหญ่เกิน 1 MB`);
          return false;
        }
        let raw: string;
        try {
          raw = await readFileAsUtf8Text(file);
        } catch (err) {
          setFileImportError(err instanceof Error ? err.message : "อ่านไฟล์ไม่สำเร็จ");
          return false;
        }
        const id = newImportId();
        entries.push({
          slot: {
            id,
            fieldKey: primaryFieldKey,
            fileName: file.name,
            sizeBytes: file.size,
            kind: "text",
          },
          body: raw,
        });
        return true;
      };

      const pushPdfDifyUpload = async (file: File): Promise<boolean> => {
        if (file.size > MAX_ATTACH_BYTES) {
          setFileImportError(
            `ไฟล์ "${file.name}" ใหญ่เกิน ${formatBytes(MAX_ATTACH_BYTES)}`,
          );
          return false;
        }
        const fd = new FormData();
        fd.append("file", file, file.name);
        console.log("[studio] upload start -> /api/dify-upload", {
          fileName: file.name,
          sizeBytes: file.size,
          mimeType: file.type,
        });
        let res: Response;
        try {
          res = await fetch("/api/dify-upload", { method: "POST", body: fd });
        } catch {
          setFileImportError(`อัปโหลด "${file.name}" ไปเซิร์ฟเวอร์ไม่สำเร็จ`);
          return false;
        }
        console.log("[studio] upload response -> /api/dify-upload", {
          fileName: file.name,
          status: res.status,
          ok: res.ok,
        });
        let data: {
          id?: string;
          error?: string;
          knowledge?: { documentId: string; batch: string } | null;
        };
        try {
          data = (await res.json()) as typeof data;
        } catch {
          setFileImportError(`อัปโหลด "${file.name}" — อ่านคำตอบไม่ได้`);
          return false;
        }
        console.log("[studio] upload payload -> /api/dify-upload", {
          fileName: file.name,
          id: data.id,
          error: data.error,
          knowledgeDocumentId: data.knowledge?.documentId,
          knowledgeBatch: data.knowledge?.batch,
        });
        if (!res.ok) {
          setFileImportError(data.error ?? `อัปโหลดไป Dify ไม่สำเร็จ (HTTP ${res.status})`);
          return false;
        }
        if (!data.id) {
          setFileImportError(`อัปโหลด "${file.name}" — ไม่ได้รับ id จาก Dify`);
          return false;
        }
        const id = newImportId();
        const bodyHint = data.knowledge
          ? `(อัปโหลด workflow + Knowledge: ${file.name})`
          : `(อ้างอิงไฟล์ที่อัปโหลดไป Dify: ${file.name})`;
        entries.push({
          slot: {
            id,
            fieldKey: primaryFieldKey,
            fileName: file.name,
            sizeBytes: file.size,
            kind: "pdf-dify-upload",
            uploadFileId: data.id,
          },
          body: bodyHint,
        });
        return true;
      };

      /** โหมด extract: ส่งไฟล์เข้า Knowledge แยก (โหมด upload ทำใน /api/dify-upload แล้ว) */
      const pushKnowledgeOnlyAfterExtract = async (file: File): Promise<boolean> => {
        if (!knowledgeUploadEnabled) return true;
        const fd = new FormData();
        fd.append("file", file, file.name);
        console.log("[studio] upload start -> /api/dify-knowledge-upload", {
          fileName: file.name,
          sizeBytes: file.size,
          mimeType: file.type,
        });
        let res: Response;
        try {
          res = await fetch("/api/dify-knowledge-upload", { method: "POST", body: fd });
        } catch {
          setFileImportError(`อัปโหลด "${file.name}" เข้า Knowledge ไม่สำเร็จ (เครือข่าย)`);
          return false;
        }
        console.log("[studio] upload response -> /api/dify-knowledge-upload", {
          fileName: file.name,
          status: res.status,
          ok: res.ok,
        });
        let data: { documentId?: string; error?: string };
        try {
          data = (await res.json()) as { documentId?: string; error?: string };
        } catch {
          setFileImportError(`อัปโหลด "${file.name}" เข้า Knowledge — อ่านคำตอบไม่ได้`);
          return false;
        }
        console.log("[studio] upload payload -> /api/dify-knowledge-upload", {
          fileName: file.name,
          documentId: data.documentId,
          error: data.error,
        });
        if (!res.ok) {
          setFileImportError(
            data.error ?? `เพิ่มเข้า Knowledge ไม่สำเร็จ (HTTP ${res.status})`,
          );
          return false;
        }
        if (!data.documentId) {
          setFileImportError(`อัปโหลด "${file.name}" เข้า Knowledge — ไม่ได้รับ documentId`);
          return false;
        }
        return true;
      };

      const pushPdfExtract = async (file: File): Promise<boolean> => {
        if (file.size > MAX_ATTACH_BYTES) {
          setFileImportError(
            `ไฟล์ "${file.name}" ใหญ่เกิน ${formatBytes(MAX_ATTACH_BYTES)}`,
          );
          return false;
        }
        let buf: ArrayBuffer;
        try {
          buf = await readFileAsArrayBuffer(file);
        } catch {
          setFileImportError(`อ่านไฟล์ PDF "${file.name}" ไม่สำเร็จ`);
          return false;
        }
        let extracted: Awaited<ReturnType<typeof extractPdfTextFromArrayBuffer>>;
        try {
          extracted = await extractPdfTextFromArrayBuffer(buf, {
            maxChars: MAX_PDF_EXTRACT_CHARS,
          });
        } catch (err) {
          setFileImportError(
            err instanceof Error
              ? `แยกข้อความจาก "${file.name}" ไม่สำเร็จ — ${err.message}`
              : `แยกข้อความจาก "${file.name}" ไม่สำเร็จ`,
          );
          return false;
        }

        const t = extracted.text.trim();
        const id = newImportId();
        if (t.length >= MIN_PDF_EXTRACTED_CHARS) {
          const tail = extracted.truncated
            ? "\n\n_(แอปตัดความยาวบางส่วนตามขีดจำกัด — ไฟล์มีหลายหน้าหรือยาวมาก)_"
            : "";
          const body = `## เนื้อหาจาก PDF: ${file.name} (${extracted.pageCount} หน้า)\n\n${t}${tail}`;
          entries.push({
            slot: {
              id,
              fieldKey: primaryFieldKey,
              fileName: file.name,
              sizeBytes: file.size,
              kind: "pdf-embedded",
            },
            body,
          });
        } else {
          ragFilesToAdd.push(file);
          const body = `## หมายเหตุ (PDF: ${file.name})\nไม่พบข้อความที่ดึงได้จากไฟล์นี้ (บ่อยครั้งเมื่อเป็น PDF สแกนเป็นภาพ) — โปรดวางเนื้อหาในช่องนี้ด้วยตนเอง หรืออัปโหลดเอกสารเข้า Knowledge ใน Dify แล้วอ้างชื่อไฟล์ให้ตรง`;
          entries.push({
            slot: {
              id,
              fieldKey: primaryFieldKey,
              fileName: file.name,
              sizeBytes: file.size,
              kind: "pdf-rag",
              ragFile: file,
            },
            body,
          });
        }
        if (!(await pushKnowledgeOnlyAfterExtract(file))) return false;
        return true;
      };

      const hasAnyPdf = incoming.some((f) => isPdfFile(f));
      if (hasAnyPdf) {
        setPdfImportBusy?.(true);
      }
      try {
        for (let i = 0; i < incoming.length; i++) {
          const file = incoming[i];
          if (isTextImportFile(file)) {
            if (!(await pushTextFile(file))) return;
          } else if (isPdfFile(file)) {
            if (pdfHandling === "upload") {
              if (!(await pushPdfDifyUpload(file))) return;
            } else if (!(await pushPdfExtract(file))) {
              return;
            }
          } else {
            setFileImportError(
              `ไฟล์ "${file.name}" ไม่รองรับ — ใช้ .txt / .md / .json หรือ .pdf`,
            );
            return;
          }
        }
      } finally {
        if (hasAnyPdf) {
          setPdfImportBusy?.(false);
        }
      }

      const curRag = getFieldAttachmentCount(primaryFieldKey);
      if (curRag + ragFilesToAdd.length > MAX_ATTACH_PER_FIELD) {
        setFileImportError(`แนบ PDF (โหมดอ้างชื่อใน RAG) ได้ไม่เกิน ${MAX_ATTACH_PER_FIELD} ไฟล์ต่อช่อง`);
        return;
      }

      if (ragFilesToAdd.length) {
        setFieldAttachments((prev) => ({
          ...prev,
          [primaryFieldKey]: [...(prev[primaryFieldKey] ?? []), ...ragFilesToAdd],
        }));
      }

      if (entries.length) {
        registerImports(entries);
      }

      const el = unifiedFileInputRef.current;
      if (el) el.value = "";
    },
    [
      getFieldAttachmentCount,
      pdfHandling,
      registerImports,
      setFieldAttachments,
      setFileImportError,
      setPdfImportBusy,
      knowledgeUploadEnabled,
    ],
  );

  return {
    unifiedFileInputRef,
    handleUnifiedFiles,
  };
}
