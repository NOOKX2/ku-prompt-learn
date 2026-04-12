import { KU_FACULTY_OPTIONS } from "@/lib/ku-faculties";

export type FieldType = "text" | "textarea" | "select" | "number";

export type TemplateField = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  /** แสดงฟิลด์นี้เมื่อฟิลด์อื่นมีค่าตรงกับที่กำหนด */
  showWhen?: { field: string; value: string };
};

export type PromptTemplate = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  fields: TemplateField[];
  buildPrompt: (values: Record<string, string>) => string;
};

const trim = (s: string) => s.trim();

/** จำนวนข้อจากฟอร์ม — ช่องว่าง / ไม่ใช่ตัวเลข / ติดลบ → ใช้ whenEmpty (ปรนัยว่างแล้ว default 5) */
function parseExamQuestionCount(raw: string | undefined, whenEmpty: number): number {
  const s = String(raw ?? "").trim();
  if (s === "") return whenEmpty;
  const n = Number.parseInt(s, 10);
  if (!Number.isFinite(n) || n < 0) return whenEmpty;
  return n;
}

function formatFacultyMajor(v: Record<string, string>): string {
  const rawFaculty = trim(v.faculty || "");
  const other = trim(v.faculty_other || "");
  const major = trim(v.major || "");

  let facultyName = "";
  if (rawFaculty === "__other__") {
    facultyName = other || "คณะ (ผู้ใช้ยังไม่ระบุชื่อคณะ)";
  } else {
    facultyName = rawFaculty;
  }

  const parts: string[] = [];
  if (facultyName) parts.push(`คณะ ${facultyName}`);
  if (major) parts.push(`สาขา ${major}`);
  return parts.join(" · ");
}

export const promptTemplates: PromptTemplate[] = [
  {
    id: "mock-exam",
    shortTitle: "ข้อสอบจำลอง",
    title: "สร้างข้อสอบจำลองตามรายวิชาและระดับความยาก",
    description:
      "ใช้บทบาทอาจารย์ผู้สอบ มก. — ปรนัย/อัตนัยตามจำนวนที่ตั้ง; ผลลัพธ์เป็น JSON สำหรับเปิดหน้า «ทำข้อสอบ» ในเว็บนี้",
    fields: [
      {
        key: "subject",
        label: "รายวิชา / หัวข้อ",
        type: "text",
        placeholder: "เช่น เศรษฐศาสตร์เบื้องต้น",
        required: true,
      },
      {
        key: "faculty",
        label: "คณะ",
        type: "select",
        options: KU_FACULTY_OPTIONS,
      },
      {
        key: "faculty_other",
        label: "ระบุชื่อคณะ",
        type: "text",
        placeholder: "เช่น คณะวิทยาศาสตร์และวิศวกรรมศาสตร์ ฯลฯ",
        showWhen: { field: "faculty", value: "__other__" },
      },
      {
        key: "major",
        label: "สาขา (ถ้ามี)",
        type: "text",
        placeholder: "เช่น เศรษฐศาสตร์ สาขาเศรษฐศาสตร์ทั่วไป",
      },
      {
        key: "chapters",
        label: "ช่วงเนื้อหา (บท / หน้า / ไฟล์ที่แนบ)",
        type: "textarea",
        placeholder: "เช่น บทที่ 1–3 หรืออธิบายว่าแนบ PDF อะไร",
      },
      {
        key: "focus",
        label: "ประเด็นที่อยากให้เน้นสอบ",
        type: "textarea",
        placeholder: "เช่น อุปสงค์อุปทาน ความยืดหยุ่นของอุปสงค์",
      },
      {
        key: "difficulty",
        label: "ระดับความยาก",
        type: "select",
        options: [
          { value: "พื้นฐาน", label: "พื้นฐาน" },
          { value: "ปานกลาง", label: "ปานกลาง" },
          { value: "สูง (เข้มข้นเหมือนสอบจริง)", label: "สูง" },
        ],
      },
      {
        key: "count",
        label: "จำนวนข้อปรนัย (0 = ไม่สร้างข้อปรนัย)",
        type: "number",
        placeholder: "เช่น 5",
      },
      {
        key: "count_essay",
        label: "จำนวนข้ออัตนัย (0 = ไม่สร้างข้ออัตนัย)",
        type: "number",
        placeholder: "เช่น 2",
      },
      {
        key: "material",
        label: "เนื้อหาอ้างอิง (วางข้อความจากสรุป / สไลด์ / บทเรียน)",
        type: "textarea",
        placeholder:
          "วางข้อความที่ต้องการให้ AI ใช้เป็นฐานเท่านั้น (ลดการเดาเนื้อหานอกเหนือจากนี้)",
      },
    ],
    buildPrompt: (v) => {
      const subject = trim(v.subject || "");
      const facultyMajor = formatFacultyMajor(v);
      const chapters = trim(v.chapters || "");
      const focus = trim(v.focus || "");
      const difficulty = trim(v.difficulty || "ปานกลาง");
      let nMcq = parseExamQuestionCount(v.count, 5);
      let nEssay = parseExamQuestionCount(v.count_essay, 0);
      if (nMcq === 0 && nEssay === 0) nMcq = 5;
      const material = trim(v.material || "");

      const taskLines: string[] = [];
      taskLines.push(`ระดับความยากโดยรวม: ${difficulty}`);
      if (nMcq > 0) {
        taskLines.push(`- สร้างข้อสอบแบบปรนัย (เลือกคำตอบเดียว) จำนวน ${nMcq} ข้อ — แต่ละข้อมีตัวเลือกหลอกจากจุดที่นิสิตมักเข้าใจผิด`);
      }
      if (nEssay > 0) {
        taskLines.push(
          `- สร้างข้อสอบแบบอัตนัย จำนวน ${nEssay} ข้อ — คำถามเปิด/วิเคราะห์/อธิบาย ตามความเหมาะสมกับเนื้อหา (ไม่มีตัวเลือก ก ข ค ง)`,
        );
      }

      const ruleSteps: string[] = [
        "สรุปสั้นๆ ว่าจะวัดสาระสำคัญอะไรจากเนื้อหาที่ให้",
      ];
      if (nMcq > 0) {
        ruleSteps.push(
          "สำหรับข้อปรนัย: ร่างโจทย์แต่ละข้อพร้อมตัวเลือกหลอกจากจุดที่นิสิตมักเข้าใจผิด และให้เฉลยพร้อมเหตุผลทีละข้อ",
        );
      }
      if (nEssay > 0) {
        ruleSteps.push(
          "สำหรับข้ออัตนัย: ระบุคำถามให้ชัด กำหนดคะแนนหรือเกณฑ์ให้คะแนน (rubric) แบบย่อ และให้แนวเฉลยหรือประเด็นที่คำตอบควรครอบคลุม — ไม่ใช้ตัวเลือก ก ข ค ง",
        );
      }
      ruleSteps.push(
        "ตรวจทานว่าข้อสอบสอดคล้องกับเนื้อหาที่ให้ ไม่ดึงความรู้ภายนอกที่ไม่เกี่ยวข้อง",
      );
      ruleSteps.push(
        "ผลลัพธ์สุดท้ายต้องเป็น JSON ชุดเดียวตามโครงสร้างด้านล่าง — ห้ามมีข้อความนอก JSON ห้ามห่อด้วย markdown",
      );
      const rulesBlock = ruleSteps.map((line, i) => `${i + 1}) ${line}`).join("\n");

      const mcqCountLine =
        nMcq > 0
          ? `แถวใน "mcq" ต้องมีครบ ${nMcq} ข้อ (แต่ละข้อ type เป็น "mcq" มี choices อย่างน้อย 2 ตัวเลือก — แนะนำ 4 ตัว id A B C D; correctChoiceId ต้องเป็น id หนึ่งในข้อนั้น)`
          : `ให้ "mcq" เป็นอาร์เรย์ว่าง []`;
      const essayCountLine =
        nEssay > 0
          ? `แถวใน "essay" ต้องมีครบ ${nEssay} ข้อ (type เป็น "essay")`
          : `ให้ "essay" เป็นอาร์เรย์ว่าง []`;

      return `คุณเป็นอาจารย์ผู้สอนรายวิชา "${subject}"${facultyMajor ? ` (${facultyMajor})` : ""} มหาวิทยาลัยเกษตรศาสตร์

## งาน
${taskLines.join("\n")}
${chapters ? `ช่วงเนื้อหา/แหล่งอ้างอิงที่ผู้เรียนระบุ: ${chapters}` : ""}
${focus ? `ให้เน้นวัดความเข้าใจเรื่อง: ${focus}` : ""}

## กฎ (Chain-of-Thought — ทำตามลำดับก่อนตอบ)
${rulesBlock}

## เนื้อหาที่อนุญาตให้ใช้ (ใช้เฉพาะนี้เป็นหลัก)
${material || "(ผู้ใช้ยังไม่ได้วางข้อความยาวในช่อง — ถ้ามีการส่ง PDF ผ่าน Dify workflow ให้ใช้เนื้อหาที่ workflow/ระบบอ่านจากไฟล์ส่งมาให้คุณ; ถ้าไม่มีทั้งข้อความและเนื้อหาจากไฟล์ในระบบ ให้แจ้งว่าขาดข้อมูล)"}

## รูปแบบผลลัพธ์ (บังคับ — นำไปแสดงบนเว็บ KU PromptLearn)
ตอบเป็น **JSON เดียวที่ parse ได้** เท่านั้น — ไม่ใส่ \`\`\`json ไม่มีคำอธิบายก่อน/หลัง

**สำคัญมาก — จำนวนข้อ:** อาร์เรย์ \`mcq\` ต้องมีความยาว **เท่ากับ ${nMcq} รายการพอดี** และอาร์เรย์ \`essay\` ต้องมีความยาว **เท่ากับ ${nEssay} รายการพอดี** — **ห้ามส่งแค่ตัวอย่าง 1 ข้อ** หรือโครงร่างว่างแทนข้อสอบจริง  
ก่อนส่งให้ตรวจในใจว่า \`mcq.length === ${nMcq}\` และ \`essay.length === ${nEssay}\`

คีย์ระดับบน: examVersion, title, subject, difficulty, instructions, mcq, essay, answerKey  
แต่ละองค์ประกอบใน mcq มีฟิลด์: id, type ("mcq"), prompt, choices (อย่างน้อย 2 ตัวเลือก แต่ละตัว {id,label}), correctChoiceId (ต้องตรงกับ id ในข้อนั้น)  
แต่ละองค์ประกอบใน essay มีฟิลด์: id, type ("essay"), prompt, maxScore (ถ้ามี), rubricHint, modelAnswer  
subject ใช้ ${JSON.stringify(subject)} และ difficulty ใช้ ${JSON.stringify(difficulty)} หรือข้อความสอดคล้อง

ตัวอย่างรูปแบบ **หนึ่งข้อปรนัย** (ต้องทำซ้ำให้ครบ ${nMcq} ข้อ โดย id ไม่ซ้ำ เช่น mcq1 … mcq${nMcq > 0 ? String(nMcq) : "0"}):
{"id":"mcq1","type":"mcq","prompt":"…","choices":[{"id":"A","label":"…"},{"id":"B","label":"…"},{"id":"C","label":"…"},{"id":"D","label":"…"}],"correctChoiceId":"A"}

${nEssay > 0 ? `ตัวอย่างรูปแบบหนึ่งข้ออัตนัย (ต้องมีครบ ${nEssay} ข้อ โดย id ไม่ซ้ำ):\n{"id":"e1","type":"essay","prompt":"…","maxScore":5,"rubricHint":"…","modelAnswer":"…"}\n` : ""}answerKey.mcq ต้องมีคีย์ตรงกับ id แต่ละข้อปรนัยและค่าเป็น id ข้อที่ถูก

ข้อกำหนดจำนวน (ทบทวน):
- ${mcqCountLine}
- ${essayCountLine}
- ทุกข้อต้องมี "id" ไม่ซ้ำกันในทั้งชุด; "correctChoiceId" ต้องตรงกับ id ในข้อนั้น
- "answerKey.mcq" ต้องสอดคล้องกับ correctChoiceId ของแต่ละข้อปรนัย

## คำเตือน
ถ้าเนื้อหาที่ให้ไม่พอ ให้ตอบเป็น JSON ที่มี "examVersion":"1", "title":"ไม่สามารถสร้างข้อสอบได้", "mcq":[], "essay":[], "instructions":"อธิบายว่าขาดข้อมูลส่วนใด" — ห้ามเดาเนื้อหาวิชา`;
    },
  },
  {
    id: "gen-z-simplify",
    shortTitle: "ย่อยเนื้อหา",
    title: "ย่อยเนื้อหาซับซ้อนให้เข้าใจง่าย (โทน Gen Z)",
    description:
      "ใช้ภาษาที่เข้าถึงได้ แต่ยังคงความถูกต้อง — แยกคำศัพท์สำคัญและตัวอย่างสั้นๆ",
    fields: [
      {
        key: "topic",
        label: "หัวข้อ / บริบท",
        type: "text",
        placeholder: "เช่น ทฤษฎีเกม หรือ กลไกการสังเคราะห์โปรตีน",
        required: true,
      },
      {
        key: "tone",
        label: "โทนการอธิบาย",
        type: "select",
        options: [
          { value: "สนุก กระชับ มีมุกเบาๆ แต่ไม่ลามเลย", label: "สนุก กระชับ" },
          { value: "เป็นกันเองแต่เป็นทางการ", label: "กลางๆ เป็นกันเอง" },
          { value: "เป็นทางการ ใช้ศัพท์วิชาชัดเจน", label: "เน้นความแม่นยำ" },
        ],
      },
      {
        key: "length",
        label: "ความยาวที่ต้องการ",
        type: "select",
        options: [
          { value: "ย่อมาก (bullet สั้นๆ)", label: "สั้นมาก" },
          { value: "กลาง (1 ย่อหน้า + ตัวอย่าง)", label: "กลาง" },
          { value: "ละเอียด (มีขั้นตอน/เปรียบเทียบ)", label: "ละเอียด" },
        ],
      },
      {
        key: "content",
        label: "เนื้อหาที่ต้องการให้ย่อย (วางจากตำรา/สรุป)",
        type: "textarea",
        placeholder: "วางข้อความหรือโน้ตที่ต้องการให้ถอดความ",
        required: true,
      },
    ],
    buildPrompt: (v) => {
      const topic = trim(v.topic || "");
      const tone = trim(v.tone || "เป็นกันเองแต่เป็นทางการ");
      const length = trim(v.length || "กลาง (1 ย่อหน้า + ตัวอย่าง)");
      const content = trim(v.content || "");

      return `คุณเป็นติวเตอร์สำหรับนิสิตมหาวิทยาลัยเกษตรศาสตร์ ช่วยอธิบายหัวข้อ "${topic}"

## สไตล์
- โทน: ${tone}
- ความยาว: ${length}
- ใช้ภาษาที่เข้าถึงได้ (เหมาะกับ Gen Z) แต่ห้ามบิดเบือนความหมายทางวิชาการ

## ขั้นตอน (Chain-of-Thought)
1) ระบุแกนเรื่อง 3 ข้อจากเนื้อหาที่ให้
2) อธิบายทีละขั้น ใช้คำเปรียบเทียบหรือตัวอย่างสั้นๆ ถ้าจำเป็น
3) สรุปความเชื่อมโยงกับการสอบ/การใช้จริงในห้องเรียน
4) ท้ายบทความ ให้รายการ "คำศัพท์สำคัญ" พร้อมคำจำกัดความสั้นๆ

## เนื้อหาต้นฉบับ (ใช้เป็นฐานเท่านั้น)
${content}

## ข้อจำกัด
ไม่เพิ่มข้อเท็จจริงที่ไม่ปรากฏในเนื้อหาด้านบน ถ้าข้อมูลไม่พอ ให้บอกว่าต้องการรายละเอียดอะไรเพิ่ม`;
    },
  },
  {
    id: "schedule-check",
    shortTitle: "ตาราง + เช็คความเข้าใจ",
    title: "ออกแบบตารางอ่านหนังสือและตรวจสอบความเข้าใจเฉพาะบุคคล",
    description:
      "วางแผนตามเวลาที่มี จัดลำดับความสำคัญ และมีคำถามทบทวนหลังแต่ละช่วง",
    fields: [
      {
        key: "subject",
        label: "รายวิชา / บทเรียน",
        type: "text",
        placeholder: "เช่น ฟิสิกส์ 2",
        required: true,
      },
      {
        key: "examDate",
        label: "วันสอบหรือกรอบเวลา",
        type: "text",
        placeholder: "เช่น อีก 14 วัน / สอบกลางภาค 20 เม.ย.",
        required: true,
      },
      {
        key: "hoursPerDay",
        label: "ชั่วโมงที่ใช้อ่านได้ต่อวัน (โดยประมาณ)",
        type: "text",
        placeholder: "เช่น 2",
      },
      {
        key: "weak",
        label: "จุดที่ยังไม่มั่นใจ / หัวข้อที่อยากเก็บเพิ่ม",
        type: "textarea",
        placeholder: "เช่น แรงและการเคลื่อนที่ โจทย์คาน",
      },
      {
        key: "syllabus",
        label: "หัวข้อที่ต้องสอบ (ถ้ามี — วางจากไซล์บัสหรือสรุป)",
        type: "textarea",
        placeholder: "รายการหัวข้อหรือวาง outline สั้นๆ",
      },
    ],
    buildPrompt: (v) => {
      const subject = trim(v.subject || "");
      const examDate = trim(v.examDate || "");
      const hours = trim(v.hoursPerDay || "2");
      const weak = trim(v.weak || "");
      const syllabus = trim(v.syllabus || "");

      return `คุณเป็นที่ปรึกษาการเรียนสำหรับนิสิต มหาวิทยาลัยเกษตรศาสตร์

## ข้อมูล
- รายวิชา: ${subject}
- กรอบเวลา/วันสอบ: ${examDate}
- เวลาอ่านต่อวัน (โดยประมาณ): ${hours} ชม.
${weak ? `- จุดที่ต้องการเสริม: ${weak}` : ""}
${syllabus ? `- หัวข้อที่ต้องครอบคลุม:\n${syllabus}` : ""}

## งาน
1) จัดตารางอ่านหนังสือแบ่งเป็นวัน/ช่วงเวลา สอดคล้องกับชั่วโมงที่มี
2) จัดลำดับความสำคัญ: หัวข้อหนัก/จุดอ่อนของผู้เรียน มาก่อน
3) หลังแต่ละช่วงอ่าน ให้คำถามทบทวนความเข้าใจ 3–5 ข้อ (เลือกตอบสั้น/คำนวณตามสมควร)
4) วันสุดท้ายก่อนสอบ ให้แผน "รีวิวรวม" และ checklist

## วิธีคิด (Chain-of-Thought)
อธิบายสั้นๆ ว่าทำไมถึงจัดลำดับแบบนี้ ก่อนแสดงตาราง

## ข้อจำกัด
ถ้าไม่มีรายละเอียดหัวข้อ ให้ถามผู้ใช้กลับเป็นข้อๆ แทนการเดาหัวข้อย่อยลึกเกินไป`;
    },
  },
];

export function getTemplateById(id: string): PromptTemplate | undefined {
  return promptTemplates.find((t) => t.id === id);
}
