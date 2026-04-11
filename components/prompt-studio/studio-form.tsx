import type { PromptTemplate } from "@/lib/prompt-templates";
import { promptTemplates } from "@/lib/prompt-templates";
import type { ImportSlot } from "@/components/prompt-studio/import-blocks";
import { useEffect, useState, type MutableRefObject } from "react";
import {
  MAX_ATTACH_PER_FIELD,
  UNIFIED_FILE_ACCEPT,
  inputClass,
} from "@/lib/constants";
import { formatBytes } from "./helpers";

type Props = {
  templateId: string;
  template: PromptTemplate;
  attachmentFieldKey: string | null;
  values: Record<string, string>;
  fieldAttachments: Record<string, File[]>;
  importSlots: ImportSlot[];
  fileImportError: string | null;
  pdfImportBusy: boolean;
  unifiedFileInputRef: MutableRefObject<HTMLInputElement | null>;
  onSelectTemplate: (id: string) => void;
  onFieldChange: (key: string, value: string) => void;
  onUnifiedFiles: (files: FileList | null) => void;
  onRemoveImportSlot: (id: string) => void;
};

export function StudioForm(props: Props) {
  const {
    templateId,
    template,
    attachmentFieldKey,
    values,
    fieldAttachments,
    importSlots,
    fileImportError,
    pdfImportBusy,
    unifiedFileInputRef,
    onSelectTemplate,
    onFieldChange,
    onUnifiedFiles,
    onRemoveImportSlot,
  } = props;

  const slotsForField = attachmentFieldKey
    ? importSlots.filter((s) => s.fieldKey === attachmentFieldKey)
    : [];

  /** ชื่อชุดล่าสุดที่เลือกจาก file picker (รวม PDF ที่ดึงข้อความแล้วไม่มีใน attachList) */
  const [recentPickLabel, setRecentPickLabel] = useState<string | null>(null);

  useEffect(() => {
    setRecentPickLabel(null);
  }, [templateId]);

  const attachList = attachmentFieldKey ? (fieldAttachments[attachmentFieldKey] ?? []) : [];
  const attachLabel =
    attachList.length === 0
      ? "เลือกไฟล์…"
      : attachList.length === 1
        ? attachList[0].name
        : `${attachList[0].name} +${attachList.length - 1} ไฟล์`;

  const fileButtonLabel =
    attachList.length > 0
      ? attachLabel
      : slotsForField.length > 0
        ? slotsForField.length === 1
          ? slotsForField[0].fileName
          : `${slotsForField[0].fileName} +${slotsForField.length - 1} ไฟล์`
        : recentPickLabel ?? "เลือกไฟล์…";

  const primaryFieldLabel =
    attachmentFieldKey &&
    template.fields.find((f) => f.key === attachmentFieldKey)?.label;

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
        {pdfImportBusy ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
            กำลังอ่านข้อความจาก PDF… (อาจใช้เวลาสักครู่)
          </p>
        ) : null}
        {template.fields
          .filter((f) => !f.showWhen || values[f.showWhen.field] === f.showWhen.value)
          .map((f) => (
            <div key={f.key}>
              <label htmlFor={f.key} className="mb-1.5 block text-sm font-medium text-black">
                {f.label}{f.required ? <span className="text-red-600"> *</span> : null}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  id={f.key}
                  value={values[f.key] ?? ""}
                  onChange={(e) => onFieldChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={f.key === "material" ? 6 : 4}
                  className={`${inputClass} resize-y`}
                />
              ) : f.type === "select" ? (
                <select id={f.key} value={values[f.key] ?? ""} onChange={(e) => onFieldChange(f.key, e.target.value)} className={inputClass}>
                  {(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type === "number" ? (
                <input
                  id={f.key}
                  type="number"
                  min={0}
                  max={99}
                  step={1}
                  inputMode="numeric"
                  value={values[f.key] ?? ""}
                  onChange={(e) => onFieldChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className={`${inputClass} font-mono tabular-nums`}
                />
              ) : (
                <input id={f.key} type="text" value={values[f.key] ?? ""} onChange={(e) => onFieldChange(f.key, e.target.value)} placeholder={f.placeholder} className={inputClass} />
              )}
            </div>
          ))}

        {attachmentFieldKey ? (
          <div className="space-y-2 border-t border-neutral-200 pt-5">
            <p className="text-sm font-medium text-black">นำเข้าไฟล์</p>
            <p className="text-xs text-neutral-600">
              เลือก<strong className="font-medium">หลายไฟล์พร้อมกัน</strong>ได้ (Ctrl / ⌘ ค้างแล้วคลิก) · เนื้อหาจากไฟล์จะถูก<strong className="font-medium">เก็บแยก</strong>และส่งครบตอนกด «รันคำสั่ง» — ช่อง «{primaryFieldLabel ?? attachmentFieldKey}» ใช้พิมพ์เพิ่มเติมเท่านั้น ไม่แสดงข้อความยาวจาก PDF · PDF สแกนที่ดึงไม่ได้จะอ้างชื่อให้ RAG (สูงสุด {MAX_ATTACH_PER_FIELD} ไฟล์แบบนั้น) · ลบรายไฟล์จากรายการด้านล่าง
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={unifiedFileInputRef}
                type="file"
                id="unified-file-input"
                className="sr-only"
                multiple
                accept={UNIFIED_FILE_ACCEPT}
                aria-label="นำเข้าไฟล์ข้อความหรือ PDF"
                onChange={(e) => {
                  const fl = e.target.files;
                  if (fl && fl.length > 0) {
                    const names = Array.from(fl).map((f) => f.name);
                    setRecentPickLabel(
                      names.length === 1 ? names[0] : `${names[0]} +${names.length - 1} ไฟล์`,
                    );
                  }
                  onUnifiedFiles(fl);
                }}
              />
              <button
                type="button"
                onClick={() => document.getElementById("unified-file-input")?.click()}
                className={`max-w-full min-w-0 truncate rounded-lg border px-3 py-2 text-sm font-medium text-black transition ${attachList.length || recentPickLabel || slotsForField.length
                    ? "border-brand bg-brand-muted"
                    : "border-brand/40 bg-brand-muted hover:border-brand hover:bg-brand-muted/80"
                  }`}
                title={
                  attachList.length
                    ? attachList.map((x) => x.name).join(", ")
                    : slotsForField.length
                      ? slotsForField.map((s) => s.fileName).join(", ")
                      : recentPickLabel ?? undefined
                }
              >
                {fileButtonLabel}
              </button>
            </div>
            {slotsForField.length > 0 ? (
              <ul className="flex flex-col gap-1.5 rounded-lg border border-gray-200 bg-neutral-50/80 p-2 text-xs text-neutral-800">
                {slotsForField.map((slot) => {
                  const kindLabel =
                    slot.kind === "text"
                      ? "ข้อความ"
                      : slot.kind === "pdf-embedded"
                        ? "PDF → ข้อความ"
                        : "PDF → ชื่อ (RAG)";
                  return (
                    <li key={slot.id} className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate">
                        <span className="text-neutral-500">[{kindLabel}]</span> {slot.fileName}{" "}
                        <span className="text-neutral-500">({formatBytes(slot.sizeBytes)})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveImportSlot(slot.id)}
                        className="shrink-0 rounded border border-gray-300 px-1.5 py-0.5 text-[11px] hover:bg-white"
                      >
                        ลบ
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
