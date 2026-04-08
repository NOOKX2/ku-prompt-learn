"use client";

import { StudioForm } from "@/components/prompt-studio/studio-form";
import { StudioPreview } from "@/components/prompt-studio/studio-preview";
import { usePromptStudio } from "@/components/prompt-studio/use-prompt-studio";

export function PromptStudio() {
  const s = usePromptStudio();

  return (
    <div className="flex flex-col gap-10 text-black xl:flex-row xl:items-start xl:gap-8">
      <StudioForm
        templateId={s.templateId}
        template={s.template}
        values={s.values}
        fieldAttachments={s.fieldAttachments}
        fileImportError={s.ui.fileImportError}
        textFileInputRefs={s.textFileInputRefs}
        attachInputRefs={s.attachInputRefs}
        onSelectTemplate={s.selectTemplate}
        onFieldChange={s.setField}
        onTextImport={s.handleTextFileImport}
        onAttach={s.handleAttachFiles}
        onRemoveAttachment={s.removeAttachment}
      />

      <StudioPreview
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
      />
    </div>
  );
}
