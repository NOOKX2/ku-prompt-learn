"use client";

import { useRouter } from "next/navigation";
import { EXAM_JSON_STORAGE_KEY } from "@/lib/exam-json";
import { StudioForm } from "@/components/prompt-studio/studio-form";
import { StudioPreview } from "@/components/prompt-studio/studio-preview";
import { usePromptStudio } from "@/components/prompt-studio/use-prompt-studio";

export function PromptStudio() {
  const router = useRouter();
  const s = usePromptStudio();

  const openExam = () => {
    try {
      sessionStorage.setItem(EXAM_JSON_STORAGE_KEY, s.answer);
    } catch {
      /* quota / private mode */
    }
    router.push("/exam");
  };

  return (
    <div className="flex flex-col gap-10 text-black xl:flex-row xl:items-start xl:gap-8">
      <StudioForm
        templateId={s.templateId}
        template={s.template}
        attachmentFieldKey={s.attachmentFieldKey}
        values={s.values}
        fieldAttachments={s.fieldAttachments}
        importSlots={s.importSlots}
        fileImportError={s.ui.fileImportError}
        pdfImportBusy={s.ui.pdfImportBusy}
        pdfHandling={s.pdfHandling}
        knowledgeUploadEnabled={s.knowledgeUploadEnabled}
        unifiedFileInputRef={s.unifiedFileInputRef}
        onSelectTemplate={s.selectTemplate}
        onFieldChange={s.setField}
        onUnifiedFiles={(files) => {
          if (s.attachmentFieldKey) void s.handleUnifiedFiles(s.attachmentFieldKey, files);
        }}
        onRemoveImportSlot={s.removeImportSlot}
      />

      <StudioPreview
        templateId={s.templateId}
        promptText={s.promptText}
        answer={s.answer}
        loading={s.loading}
        error={s.error}
        copiedPrompt={s.clipboard.copiedPrompt}
        copiedAnswer={s.clipboard.copiedAnswer}
        downloadingPdf={s.ui.downloadingPdf}
        pdfExportError={s.ui.pdfExportError}
        onCopyPrompt={() => void s.copyPrompt()}
        onRun={() => void s.run()}
        onStop={s.stop}
        onDownloadPdf={() => void s.downloadPdf()}
        onCopyAnswer={() => void s.copyAnswer()}
        canOpenExam={s.templateId === "mock-exam"}
        onOpenExam={openExam}
      />
    </div>
  );
}
