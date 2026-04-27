export type FieldType = "text" | "textarea" | "select" | "number" | "date";

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
  /**
   * เมื่อเทมเพลตไม่มีช่อง textarea แต่ต้องการจุดเดียวสำหรับแนบไฟล์/รวม import
   * (คีย์นี้มีใน `values` แต่ไม่แสดงในฟอร์ม — ข้อความมาจาก importSlots ใน `use-prompt-studio`)
   */
  primaryImportFieldKey?: string;
  /** หัวข้ออธิบายบล็อกนำเข้าไฟล์เมื่อใช้ `primaryImportFieldKey` */
  primaryImportLabel?: string;
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

export const promptTemplates: PromptTemplate[] = [
  {
    id: "mock-exam",
    shortTitle: "ข้อสอบจำลอง",
    title: "สร้างข้อสอบจากไฟล์ (อนุมานวิชา / ติดแท็กอัตโนมัติ)",
    description:
      "อัปโหลดไฟล์เนื้อหา แล้วรัน — ไม่ต้องเลือกวิชา: โมเดลจะอ่านเอกสาร อนุมานรายวิชา/แท็ก แล้วสร้างข้อสอบปรนัย-อัตนัยตามจำนวนที่ตั้ง ผลลัพธ์เป็น JSON สำหรับ «ทำข้อสอบ»",
    primaryImportFieldKey: "importContent",
    primaryImportLabel: "เอกสารอ้างอิง",
    fields: [
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
    ],
    buildPrompt: (v) => {
      const difficulty = trim(v.difficulty || "ปานกลาง");
      let nMcq = parseExamQuestionCount(v.count, 5);
      let nEssay = parseExamQuestionCount(v.count_essay, 0);
      if (nMcq === 0 && nEssay === 0) nMcq = 5;

      const taskLines: string[] = [];
      taskLines.push("ขั้นแรก: อ่านเนื้อหาเอกสาร/ไฟล์ที่ส่งมา แล้ว **อนุมาน** รายวิชา/สาขา/ระดับเนื้อหา จากข้อเท็จจริงในข้อความ ไม่เดาเกินเอกสาร");
      taskLines.push(
        "ตอบ JSON ต้องใส่ `subject` เป็นชื่อรายวิชาสั้นๆ ตามเนื้อหาจริง (TH หรือ TH+EN) และใส่ `subjectTags` เป็นอาร์เรย์สตริง 3–8 รายการ (แท็ก/ประเภทเช่น วิทยาศาสตร์, เคมี, สอบกลางภาค, programming — อิงเนื้อหาที่อ่านได้เท่านั้น)",
      );
      taskLines.push(`ตั้ง \`title\` ของชุดข้อสอบให้สื่อเนื้อหา/วิชาที่อนุมาน — กำหนด \`difficulty\` ให้สอดคล้องกับระดับที่ผู้ใช้เลือก: ${difficulty} (อนุญาตปรับข้อความย่อยถ้าเนื้อหาไม่รองรับ)`);
      taskLines.push(`ระดับความยากโดยรวมที่ใช้สร้างข้อ: ${difficulty}`);
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

      return `คุณเป็นอาจารย์ผู้สอนมหาวิทยาลัยเกษตรศาสตร์ ผู้ออกแบบข้อสอบจาก **เนื้อหาเอกสารที่ส่งมา** — ผู้ใช้ไม่ระบุชื่อวิชาเอง: คุณต้อง **สรุปอนุมานวิชาและติดแท็ก (subject + subjectTags)** จากเอกสาร

## งาน
${taskLines.join("\n")}

## กฎ (Chain-of-Thought — ทำตามลำดับก่อนตอบ)
${rulesBlock}

## เนื้อหาที่อนุญาตให้ใช้ (ใช้เฉพาะนี้เป็นหลัก)
(ให้ใช้เนื้อหาจากไฟล์แนบ/ข้อความที่ Dify/ระบบส่งมาในบริบทเท่านั้น; หากไม่มีเนื้อหาเอกสารเพียงพอ ให้ตอบ JSON ล้มเหลวตามส่วน «คำเตือน» ข้างล่าง)

## รูปแบบผลลัพธ์ (บังคับ — นำไปแสดงบนเว็บ KU PromptLearn)
ตอบเป็น **JSON เดียวที่ parse ได้** เท่านั้น — ไม่ใส่ \`\`\`json ไม่มีคำอธิบายก่อน/หลัง

**สำคัญมาก — จำนวนข้อ:** อาร์เรย์ \`mcq\` ต้องมีความยาว **เท่ากับ ${nMcq} รายการพอดี** และอาร์เรย์ \`essay\` ต้องมีความยาว **เท่ากับ ${nEssay} รายการพอดี** — **ห้ามส่งแค่ตัวอย่าง 1 ข้อ** หรือโครงร่างว่างแทนข้อสอบจริง  
ก่อนส่งให้ตรวจในใจว่า \`mcq.length === ${nMcq}\` และ \`essay.length === ${nEssay}\`

คีย์ระดับบน: examVersion, title, **subject** (อนุมานจากเอกสาร), **subjectTags** (อาร์เรย์สตริง), difficulty, instructions, mcq, essay, answerKey  
- **subject** ต้องสะท้อนรายวิชา/เนื้อหาหลักที่อ่านได้จากเอกสาร
- **subjectTags** ต้องเป็นอาร์เรย์สตริงว่างไม่ได้ — ใส่ 3–8 รายการ (สั้น กระชับ)  
แต่ละองค์ประกอบใน mcq มีฟิลด์: id, type ("mcq"), prompt, choices (อย่างน้อย 2 ตัวเลือก แต่ละตัว {id,label}), correctChoiceId (ต้องตรงกับ id ในข้อนั้น)  
แต่ละองค์ประกอบใน essay มีฟิลด์: id, type ("essay"), prompt, maxScore (ถ้ามี), rubricHint, modelAnswer  
\`difficulty\` ใน JSON ต้องสอดคล้องกับระดับที่ผู้ใช้กำหนด: ${JSON.stringify(difficulty)}

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
      "ย่อยเนื้อหาแบบอ่านง่าย และส่งผลลัพธ์เป็น JSON สำหรับแสดงผลสรุปบนเว็บ",
    primaryImportFieldKey: "importContent",
    primaryImportLabel: "เอกสารอ้างอิง",
    fields: [
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
    ],
    buildPrompt: (v) => {
      const topic = "เนื้อหาจากไฟล์/บริบทที่ระบบส่งให้";
      const tone = trim(v.tone || "เป็นกันเองแต่เป็นทางการ");
      const length = trim(v.length || "กลาง (1 ย่อหน้า + ตัวอย่าง)");

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
(ให้ใช้เนื้อหาจากไฟล์แนบ/บริบทที่ระบบส่งผ่าน Dify เป็นหลัก; ถ้าข้อมูลไม่พอให้ระบุสิ่งที่ขาดแทนการเดา)

## ข้อจำกัด
ไม่เพิ่มข้อเท็จจริงที่ไม่ปรากฏในเนื้อหาด้านบน ถ้าข้อมูลไม่พอ ให้บอกว่าต้องการรายละเอียดอะไรเพิ่ม

## รูปแบบผลลัพธ์ (บังคับ)
ตอบเป็น JSON เดียวที่ parse ได้เท่านั้น — ห้ามใส่ markdown (\`\`\`json) และห้ามมีข้อความก่อน/หลัง JSON

schema:
{
  "summaryVersion": "1",
  "topic": ${JSON.stringify(topic)},
  "tone": ${JSON.stringify(tone)},
  "length": ${JSON.stringify(length)},
  "corePoints": ["ประเด็นแกนข้อ 1", "ประเด็นแกนข้อ 2", "ประเด็นแกนข้อ 3"],
  "explanationSteps": [
    { "title": "หัวข้อย่อย", "detail": "คำอธิบาย", "example": "ตัวอย่างสั้นๆ (ถ้ามี)" }
  ],
  "examConnection": "สรุปความเชื่อมโยงกับการสอบ/การใช้จริง",
  "keywords": [
    { "term": "คำศัพท์", "definition": "คำจำกัดความสั้นๆ" }
  ],
  "needsMoreInfo": false,
  "missingInfo": []
}

ถ้าข้อมูลไม่พอ:
- ให้ "needsMoreInfo" เป็น true
- ใส่รายการสิ่งที่ขาดใน "missingInfo"
- ค่าอื่นเติมเท่าที่สรุปได้โดยไม่เดา`;
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
        key: "examDate",
        label: "วันสอบหรือกรอบเวลา",
        type: "date",
        required: true,
      },
      {
        key: "hoursPerDay",
        label: "ชั่วโมงที่ใช้อ่านได้ต่อวัน (โดยประมาณ)",
        type: "number",
        placeholder: "เช่น 2",
      },
      {
        key: "weak",
        label: "จุดที่ยังไม่มั่นใจ / หัวข้อที่อยากเก็บเพิ่ม",
        type: "textarea",
        placeholder: "เช่น แรงและการเคลื่อนที่ โจทย์คาน",
      },
    ],
    buildPrompt: (v) => {
      const subject = "รายวิชาที่ผู้ใช้กำลังทบทวน";
      const examDate = trim(v.examDate || "");
      const hours = trim(v.hoursPerDay || "2");
      const weak = trim(v.weak || "");

      return `คุณเป็นที่ปรึกษาการเรียนสำหรับนิสิต มหาวิทยาลัยเกษตรศาสตร์

## ข้อมูล
- รายวิชา: ${subject}
- กรอบเวลา/วันสอบ: ${examDate}
- เวลาอ่านต่อวัน (โดยประมาณ): ${hours} ชม.
${weak ? `- จุดที่ต้องการเสริม: ${weak}` : ""}

## งาน
1) สร้าง "ตารางอ่านหนังสือ" เป็นวัน/ช่วงเวลา โดยพยายามจัดให้ครบช่วงก่อนถึงวันสอบ
2) จัดลำดับความสำคัญ: หัวข้อหนัก/จุดอ่อนของผู้เรียน มาก่อน
3) หลังแต่ละช่วงอ่าน ให้คำถามทบทวนความเข้าใจ 3–5 ข้อ
4) วันสุดท้ายก่อนสอบ ให้แผน "รีวิวรวม" และ checklist

## ข้อจำกัด
- ถ้าไม่มีรายละเอียดหัวข้อพอ ให้ใส่คำถามกลับไปที่ผู้ใช้ใน field ที่เหมาะสม (อย่าเดารายละเอียดลึกเกินไป)
- ห้ามมีข้อความนอก JSON

## รูปแบบผลลัพธ์ (บังคับ) — JSON เท่านั้น
ตอบเป็น **JSON เดียวที่ parse ได้เท่านั้น** (ห้าม \`\`\`json, ห้าม markdown, ห้ามข้อความก่อน/หลัง)

schema:
{
  "id": "ตารางอ่านหนังสือ",
  "planVersion": "1",
  "title": "ตารางอ่านหนังสือสำหรับ <วิชา>",
  "subject": ${JSON.stringify(subject)},
  "examDate": ${JSON.stringify(examDate)},
  "hoursPerDay": ${JSON.stringify(hours)},
  "weak": ${JSON.stringify(weak || "")},
  "syllabus": "",
  "schedule": [
    {
      "dayIndex": 1,
      "label": "Day 1",
      "date": null,
      "sessions": [
        {
          "timeRange": "08:00-10:00",
          "topics": ["หัวข้อย่อย 1", "หัวข้อย่อย 2"],
          "reviewQuestions": ["คำถามทบทวน 1", "คำถามทบทวน 2", "คำถามทบทวน 3"]
        }
      ],
      "dailyChecklist": ["เช็คสิ่งที่ควรทำ/เข้าใจในวันนี้"]
    }
  ],
  "reviewChecklist": ["Checklist รีวิวรวมก่อนสอบ"]
}

หมายเหตุ:
- schedule ต้องเป็นอาร์เรย์ (อย่างน้อย 5 วัน)
- reviewChecklist ต้องเป็นอาร์เรย์ของ string
`;
    },
  },
];

export function getTemplateById(id: string): PromptTemplate | undefined {
  return promptTemplates.find((t) => t.id === id);
}
