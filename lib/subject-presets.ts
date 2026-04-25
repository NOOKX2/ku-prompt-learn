export type SubjectPreset = {
  id: string;
  emoji: string;
  label: string;
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
    presets: [
      {
        id: "gen-chem",
        emoji: "⚗️",
        label: "เคมีทั่วไป",
        fields: {
          subject: "เคมีทั่วไป (General Chemistry)",
          focus:
            "สมการเคมีและการดุลสมการ · แนวคิดโมลและสโตอิคิโอเมทรี · พันธะเคมี (ไอออนิก โคเวเลนต์ เมทัลลิก) · ทฤษฎีกรด-เบส (Arrhenius, Brønsted-Lowry) และค่า pH · สมดุลเคมีและค่า K · อัตราการเกิดปฏิกิริยาเบื้องต้น",
        },
      },
      {
        id: "calculus1",
        emoji: "📐",
        label: "แคลคูลัส 1",
        fields: {
          subject: "แคลคูลัส 1 (Calculus I)",
          focus:
            "ลิมิตและความต่อเนื่อง · กฎอนุพันธ์ (power, chain, product, quotient rule) · อนุพันธ์ประยุกต์ (ค่าสูงสุด-ต่ำสุด, optimization, related rates) · ปริพันธ์ไม่จำกัดขอบเขตและเทคนิค (substitution, integration by parts) · ทฤษฎีพื้นฐานแคลคูลัส (FTC)",
        },
      },
      {
        id: "bio101",
        emoji: "🧬",
        label: "ชีววิทยา 101",
        fields: {
          subject: "ชีววิทยาเบื้องต้น (Biology 101)",
          focus:
            "โครงสร้างและหน้าที่เซลล์ (organelles, membrane transport) · การแบ่งเซลล์ (mitosis vs meiosis) · กรดนิวคลีอิก DNA/RNA และกระบวนการสังเคราะห์โปรตีน (transcription, translation) · กฎของเมนเดลและการถ่ายทอดพันธุกรรม · วิวัฒนาการและการคัดเลือกโดยธรรมชาติ",
        },
      },
      {
        id: "physics1",
        emoji: "⚡",
        label: "ฟิสิกส์ทั่วไป",
        fields: {
          subject: "ฟิสิกส์ทั่วไป 1 (Physics I — Mechanics)",
          focus:
            "การเคลื่อนที่ในมิติ 1 และ 2 (kinematics) · กฎนิวตันและประยุกต์ · งาน พลังงาน และกฎอนุรักษ์ · โมเมนตัมเชิงเส้นและการชน · การเคลื่อนที่แบบหมุนและโมเมนต์ความเฉื่อย · กฎอนุรักษ์พลังงานเชิงกลรวม",
        },
      },
      {
        id: "statistics",
        emoji: "📊",
        label: "สถิติ",
        fields: {
          subject: "สถิติและความน่าจะเป็น (Statistics & Probability)",
          focus:
            "สถิติเชิงพรรณนา (mean, median, mode, SD, variance) · ความน่าจะเป็นและการแจกแจง (binomial, normal, Poisson) · การสุ่มตัวอย่างและการแจกแจงของตัวสถิติ · ช่วงความเชื่อมั่น · การทดสอบสมมติฐาน (z-test, t-test, chi-square) · การวิเคราะห์ถดถอยเชิงเส้นเบื้องต้น",
        },
      },
      {
        id: "programming",
        emoji: "💻",
        label: "การเขียนโปรแกรม",
        fields: {
          subject: "การเขียนโปรแกรมเบื้องต้น (Introduction to Programming)",
          focus:
            "ตัวแปร ชนิดข้อมูล และโอเปอเรเตอร์ · โครงสร้างควบคุม (if/else, for, while) · ฟังก์ชันและ scope · อาร์เรย์ รายการ และดัชนี · การแก้ปัญหาด้วย algorithm และ flowchart · การตรวจจับข้อผิดพลาดเบื้องต้น (debugging)",
        },
      },
      {
        id: "econ101",
        emoji: "📈",
        label: "เศรษฐศาสตร์เบื้องต้น",
        fields: {
          subject: "เศรษฐศาสตร์เบื้องต้น (Economics 101)",
          focus:
            "อุปสงค์และอุปทานและปัจจัยที่กำหนด · ความยืดหยุ่นของอุปสงค์และอุปทาน · ดุลยภาพตลาดและผลของการเปลี่ยนแปลง · ต้นทุนการผลิต (fixed, variable, marginal, average cost) · โครงสร้างตลาด (perfect competition, monopoly, oligopoly) · นโยบายการคลังและการเงินเบื้องต้น",
        },
      },
      {
        id: "thai-history",
        emoji: "🏛️",
        label: "ประวัติศาสตร์ไทย",
        fields: {
          subject: "ประวัติศาสตร์ไทย (Thai History)",
          focus:
            "อาณาจักรโบราณและรากฐานอารยธรรมไทย (สุโขทัย อยุธยา) · การเสียกรุงและการกู้เอกราช · ยุคกรุงรัตนโกสินทร์และการปฏิรูป · สนธิสัญญาเบาวริ่งและผลกระทบ · การเปลี่ยนแปลงการปกครอง พ.ศ. 2475 · เหตุการณ์สำคัญในประวัติศาสตร์ร่วมสมัย",
        },
      },
    ],
  },
  {
    templateId: "gen-z-simplify",
    presets: [
      {
        id: "simplify-chem",
        emoji: "⚗️",
        label: "เคมีอินทรีย์",
        fields: {
          topic: "เคมีอินทรีย์เบื้องต้น — หมู่ฟังก์ชันและปฏิกิริยาพื้นฐาน",
        },
      },
      {
        id: "simplify-calc",
        emoji: "📐",
        label: "อนุพันธ์",
        fields: {
          topic: "อนุพันธ์และการประยุกต์ใช้ — หาค่าสูงสุดต่ำสุดและ optimization",
        },
      },
      {
        id: "simplify-bio",
        emoji: "🧬",
        label: "สังเคราะห์โปรตีน",
        fields: {
          topic: "กระบวนการสังเคราะห์โปรตีน — Transcription และ Translation",
        },
      },
      {
        id: "simplify-newton",
        emoji: "⚡",
        label: "กฎของนิวตัน",
        fields: {
          topic: "กฎการเคลื่อนที่ทั้ง 3 ข้อของนิวตันและการประยุกต์ในชีวิตจริง",
        },
      },
      {
        id: "simplify-econ",
        emoji: "📈",
        label: "อุปสงค์-อุปทาน",
        fields: {
          topic: "อุปสงค์ อุปทาน และดุลยภาพตลาด — อธิบายให้เข้าใจง่าย",
        },
      },
      {
        id: "simplify-stats",
        emoji: "📊",
        label: "สถิติพื้นฐาน",
        fields: {
          topic: "สถิติเชิงพรรณนาและความน่าจะเป็นเบื้องต้น",
        },
      },
    ],
  },
  {
    templateId: "schedule-check",
    presets: [
      {
        id: "sched-chem",
        emoji: "⚗️",
        label: "เคมีทั่วไป",
        fields: {
          subject: "เคมีทั่วไป (General Chemistry)",
          syllabus:
            "บทที่ 1: อะตอมและตารางธาตุ\nบทที่ 2: พันธะเคมี\nบทที่ 3: สโตอิคิโอเมทรีและการคำนวณโมล\nบทที่ 4: กรด-เบสและ pH\nบทที่ 5: สมดุลเคมี\nบทที่ 6: อัตราการเกิดปฏิกิริยา",
          weak: "การคำนวณสโตอิคิโอเมทรี · การดุลสมการ · โจทย์กรด-เบส",
        },
      },
      {
        id: "sched-calc",
        emoji: "📐",
        label: "แคลคูลัส 1",
        fields: {
          subject: "แคลคูลัส 1 (Calculus I)",
          syllabus:
            "บทที่ 1: ลิมิตและความต่อเนื่อง\nบทที่ 2: อนุพันธ์และกฎต่างๆ\nบทที่ 3: อนุพันธ์อันดับสูงและโจทย์ประยุกต์\nบทที่ 4: ปริพันธ์ไม่จำกัดขอบเขต\nบทที่ 5: ปริพันธ์จำกัดขอบเขตและ FTC",
          weak: "กฎลูกโซ่ · integration by parts · โจทย์ optimization",
        },
      },
      {
        id: "sched-bio",
        emoji: "🧬",
        label: "ชีววิทยา",
        fields: {
          subject: "ชีววิทยาเบื้องต้น (Biology 101)",
          syllabus:
            "บทที่ 1: เซลล์และออร์แกเนลล์\nบทที่ 2: การแบ่งเซลล์ (Mitosis & Meiosis)\nบทที่ 3: DNA, RNA และการสังเคราะห์โปรตีน\nบทที่ 4: พันธุศาสตร์เมนเดล\nบทที่ 5: วิวัฒนาการ",
          weak: "ความแตกต่าง mitosis vs meiosis · ขั้นตอน translation · กฎ segregation vs independent assortment",
        },
      },
      {
        id: "sched-physics",
        emoji: "⚡",
        label: "ฟิสิกส์",
        fields: {
          subject: "ฟิสิกส์ทั่วไป 1 (Physics I)",
          syllabus:
            "บทที่ 1: การเคลื่อนที่ใน 1 มิติ (kinematics)\nบทที่ 2: การเคลื่อนที่ใน 2 มิติ (projectile)\nบทที่ 3: กฎของนิวตัน\nบทที่ 4: งานและพลังงาน\nบทที่ 5: โมเมนตัมและการชน\nบทที่ 6: การหมุน",
          weak: "โจทย์คาน · แรงเสียดทาน · โจทย์การอนุรักษ์พลังงานรวม",
        },
      },
    ],
  },
];

export function getPresetsForTemplate(templateId: string): SubjectPreset[] {
  return allPresets.find((g) => g.templateId === templateId)?.presets ?? [];
}
