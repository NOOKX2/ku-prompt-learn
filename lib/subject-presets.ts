export type SubjectPreset = {
  id: string;
  emoji: string;
  label: string;
  /** สีปุ่ม preset ในหน้า studio */
  color?:
    | "red"
    | "orange"
    | "amber"
    | "green"
    | "blue"
    | "indigo"
    | "purple"
    | "pink"
    | "teal"
    | "slate";
  /** Field values to merge into the form when this preset is applied */
  fields: Record<string, string>;
};

type TemplatePresetGroup = {
  templateId: string;
  presets: SubjectPreset[];
};

const allPresets: TemplatePresetGroup[] = [
  {
    templateId: "mock-exam",
    /** วิชาอนุมานจากเอกสารโดยโมเดล — ไม่มีปุ่ม preset */
    presets: [],
  },
  {
    templateId: "gen-z-simplify",
    /** หัวข้ออิงเนื้อหาไฟล์/บริบท — ไม่ใช้ปุ่ม preset วิชา */
    presets: [],
  },
  {
    templateId: "schedule-check",
    /** รายละเอียดวิชา/กำหนดอิงเอกสาร — ไม่ใช้ปุ่ม preset วิชา */
    presets: [],
  },
];

export function getPresetsForTemplate(templateId: string): SubjectPreset[] {
  return allPresets.find((g) => g.templateId === templateId)?.presets ?? [];
}
