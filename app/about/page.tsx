import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "เกี่ยวกับโปรเจกต์",
  description:
    "แนวคิด Smart Study Workflow และความต่างจากการถามแชทบอททั่วไป",
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 bg-white px-5 py-10 text-black sm:px-6 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        เกี่ยวกับ KU PromptLearn
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed">
        โปรเจกต์นี้มุ่งช่วยนิสิต มก. รับมือกับข้อมูลทางการเรียนจำนวนมาก และเสริมทักษะ{" "}
        <span className="font-medium">Prompt Engineering</span>{" "}
        ด้วยเทมเพลตที่ออกแบบมาเฉพาะบริบทมหาวิทยาลัย — ไม่ใช่แค่แชทบอททั่วไป
      </p>

      <section className="mt-12 space-y-8">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            ก่อนและหลัง
          </h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-medium text-neutral-500">
                คำสั่งทั่วไป
              </p>
              <p className="mt-2 text-sm leading-relaxed text-black">
                &quot;ช่วยเก็งข้อสอบวิชาเศรษฐศาสตร์ให้หน่อย&quot; — มักได้คำตอบกว้างๆ
                ไม่ตรงจุด
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-medium text-brand">
                โครงสร้างจาก KU PromptLearn
              </p>
              <p className="mt-2 text-sm leading-relaxed text-black">
                ระบุบทบาทอาจารย์ มก. ช่วงเนื้อหา ประเด็นที่เน้น จำนวนข้อ
                และให้ใช้เฉพาะข้อความที่วางไว้ — ได้ชุดฝึกที่ตรวจทานได้จริงขึ้น
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            ฟีเจอร์หลัก
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-black">
            <li className="flex gap-3">
              <span className="text-brand">—</span>
              สร้างข้อสอบจำลองตามรายวิชาและระดับความยาก
            </li>
            <li className="flex gap-3">
              <span className="text-brand">—</span>
              ย่อยเนื้อหาซับซ้อนให้อ่านง่ายขึ้น
            </li>
            <li className="flex gap-3">
              <span className="text-brand">—</span>
              ออกแบบตารางอ่านหนังสือและคำถามทบทวนความเข้าใจ
            </li>
          </ul>
        </div>
      </section>

      <div className="mt-14">
        <Link
          href="/studio"
          className="inline-flex rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          ไปที่สตูดิโอ
        </Link>
      </div>
    </main>
  );
}
