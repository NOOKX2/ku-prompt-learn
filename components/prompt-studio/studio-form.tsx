import type { PromptTemplate } from "@/lib/prompt-templates";
import { promptTemplates } from "@/lib/prompt-templates";
import type { MutableRefObject } from "react";
import { ATTACH_ACCEPT, inputClass, MAX_ATTACH_PER_FIELD, TEXT_IMPORT_ACCEPT } from "./constants";
import { formatBytes } from "./helpers";

type Props = {
  templateId: string;
  template: PromptTemplate;
  values: Record<string, string>;
  fieldAttachments: Record<string, File[]>;
  fileImportError: string | null;
  textFileInputRefs: MutableRefObject<Record<string, HTMLInputElement | null>>;
  attachInputRefs: MutableRefObject<Record<string, HTMLInputElement | null>>;
  onSelectTemplate: (id: string) => void;
  onFieldChange: (key: string, value: string) => void;
  onTextImport: (fieldKey: string, files: FileList | null) => void;
  onAttach: (fieldKey: string, files: FileList | null) => void;
  onRemoveAttachment: (fieldKey: string, index: number) => void;
};

export function StudioForm(props: Props) {
  const {
    templateId, template, values, fieldAttachments, fileImportError, textFileInputRefs, attachInputRefs,
    onSelectTemplate, onFieldChange, onTextImport, onAttach, onRemoveAttachment,
  } = props;
  return (
    <div className="min-w-0 flex-1 space-y-6 xl:max-w-xl">
      <div className="rounded-2xl border border-neutral-200/90 bg-neutral-50/40 p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">เลือกเครื่องมือ</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap" role="tablist" aria-label="ประเภทเทมเพลต">
          {promptTemplates.map((t) => {
            const selected = t.id === templateId;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onSelectTemplate(t.id)}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${selected
                    ? "border-brand bg-brand-muted text-black ring-1 ring-brand/25"
                    : "border-gray-200 bg-white text-neutral-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
              >
                <span className={`font-semibold ${selected ? "text-brand" : "text-black"}`}>{t.shortTitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-neutral-800">{template.description}</p>
      <div className="space-y-5 rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
        {fileImportError ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{fileImportError}</p> : null}
        {template.fields
          .filter((f) => !f.showWhen || values[f.showWhen.field] === f.showWhen.value)
          .map((f) => (
            <div key={f.key}>
              <label htmlFor={f.key} className="mb-1.5 block text-sm font-medium text-black">
                {f.label}{f.required ? <span className="text-red-600"> *</span> : null}
              </label>
              {f.type === "textarea" ? (
                <TextareaField
                  fieldKey={f.key}
                  label={f.label}
                  value={values[f.key] ?? ""}
                  placeholder={f.placeholder}
                  rows={f.key === "material" ? 6 : 4}
                  attachments={fieldAttachments[f.key] ?? []}
                  textInputRef={(el) => { textFileInputRefs.current[f.key] = el; }}
                  attachInputRef={(el) => { attachInputRefs.current[f.key] = el; }}
                  onValueChange={(value) => onFieldChange(f.key, value)}
                  onTextImport={(files) => onTextImport(f.key, files)}
                  onAttach={(files) => onAttach(f.key, files)}
                  onRemoveAttachment={(idx) => onRemoveAttachment(f.key, idx)}
                />
              ) : f.type === "select" ? (
                <select id={f.key} value={values[f.key] ?? ""} onChange={(e) => onFieldChange(f.key, e.target.value)} className={inputClass}>
                  {(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input id={f.key} type="text" value={values[f.key] ?? ""} onChange={(e) => onFieldChange(f.key, e.target.value)} placeholder={f.placeholder} className={inputClass} />
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

type TextareaProps = {
  fieldKey: string;
  label: string;
  value: string;
  placeholder?: string;
  rows: number;
  attachments: File[];
  textInputRef: (el: HTMLInputElement | null) => void;
  attachInputRef: (el: HTMLInputElement | null) => void;
  onValueChange: (value: string) => void;
  onTextImport: (files: FileList | null) => void;
  onAttach: (files: FileList | null) => void;
  onRemoveAttachment: (index: number) => void;
};

function TextareaField(props: TextareaProps) {
  const { fieldKey, label, value, placeholder, rows, attachments, textInputRef, attachInputRef, onValueChange, onTextImport, onAttach, onRemoveAttachment } = props;
  const isUpload = attachments.length > 0;
  const attachedLabel = isUpload ? (attachments.length === 1 ? attachments[0].name : `${attachments[0].name} +${attachments.length - 1} ไฟล์`) : "แนบ PDF / รูป (ส่งไป Dify)";
  return (
    <div className="space-y-2">
      <textarea id={fieldKey} value={value} onChange={(e) => onValueChange(e.target.value)} placeholder={placeholder} rows={rows} className={`${inputClass} resize-y`} />
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <input ref={textInputRef} type="file" id={`${fieldKey}-text-file`} className="sr-only" multiple accept={TEXT_IMPORT_ACCEPT} aria-label={`นำเข้าข้อความจากไฟล์สำหรับ ${label}`} onChange={(e) => onTextImport(e.target.files)} />
          <button type="button" onClick={() => document.getElementById(`${fieldKey}-text-file`)?.click()} className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition hover:border-gray-300 hover:bg-gray-50">นำเข้าข้อความ (.txt / .md …)</button>
          <input ref={attachInputRef} type="file" id={`${fieldKey}-attach-file`} className="sr-only" multiple accept={ATTACH_ACCEPT} aria-label={`แนบ PDF หรือรูปไป Dify สำหรับ ${label}`} onChange={(e) => onAttach(e.target.files)} />
          <button type="button" onClick={() => document.getElementById(`${fieldKey}-attach-file`)?.click()} className={`max-w-full truncate rounded-lg border px-2.5 py-1.5 text-xs font-medium text-black transition ${isUpload ? "border-brand bg-brand-muted" : "border-brand/40 bg-brand-muted hover:border-brand hover:bg-brand-muted/80"}`} title={isUpload ? attachments.map((x) => x.name).join(", ") : undefined}>{attachedLabel}</button>
        </div>
        <p className="text-xs text-neutral-500">ข้อความ: ไฟล์ .txt / .md / .json สูงสุด 1 MB ต่อไฟล์ — ต่อท้ายในช่องด้านบน · แนบจริง: PDF / รูป สูงสุด {MAX_ATTACH_PER_FIELD} ไฟล์ต่อช่อง (ไฟล์ละไม่เกิน 15 MB) ส่งผ่าน API ของ Dify ตอนกดรัน</p>
        {attachments.length > 0 ? (
          <ul className="flex flex-col gap-1.5 rounded-lg border border-gray-200 bg-neutral-50/80 p-2 text-xs text-neutral-800">
            {attachments.map((file, idx) => (
              <li key={`${file.name}-${file.size}-${idx}`} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate">{file.name} <span className="text-neutral-500">({formatBytes(file.size)})</span></span>
                <button type="button" onClick={() => onRemoveAttachment(idx)} className="shrink-0 rounded border border-gray-300 px-1.5 py-0.5 text-[11px] hover:bg-white">ลบ</button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
