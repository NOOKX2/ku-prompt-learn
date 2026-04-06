import type { Metadata } from "next";
import { PromptStudio } from "@/components/prompt-studio";

export const metadata: Metadata = {
  title: "สตูดิโอสร้างคำสั่ง",
  description:
    "สร้างคำสั่งสำเร็จรูปและรันผ่าน Dify ในหน้าเว็บ — ข้อสอบจำลอง ย่อยเนื้อหา และตารางอ่านหนังสือ",
};

export default function StudioPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 bg-white px-5 py-10 text-black sm:px-8 sm:py-14">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">
          สตูดิโอ
        </p>
        <h1 className="mt-2 font-semibold tracking-tight text-lg md:text-2xl lg:text-4xl">
          สร้างและรันคำสั่ง
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-black">
          กรอกข้อมูลด้านล่าง แล้วกดรัน — ระบบจะส่งคำสั่งไปยัง Dify (Chat API)
          ฝั่งเซิร์ฟเวอร์ และแสดงคำตอบสตรีมในหน้านี้
        </p>
        <p className="mt-2 font-mono text-[11px] text-neutral-600">
          ต้องตั้งค่า DIFY_API_KEY / DIFY_API_URL และ DIFY_APP_MODE (chat หรือ completion)
          ให้ตรงกับประเภทแอปใน Dify — ถ้า error ลองเปิด{" "}
          <a
            href="/api/generate"
            className="text-brand underline"
            target="_blank"
            rel="noreferrer"
          >
            /api/generate
          </a>{" "}
          เพื่อทดสอบการเชื่อมต่อ
        </p>
      </div>

      <PromptStudio />

      <section className="mt-14 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6">
        <h2 className="text-sm font-semibold text-black">
          ข้อควรทราบ
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-black">
          <li>
            ผลลัพธ์จาก AI อาจผิดพลาดได้ — ตรวจทานกับตำราและสไลด์ประกอบการเรียนเสมอ
          </li>
          <li>
            ใช้เพื่อทบทวนส่วนตัว ไม่เผยแพร่เนื้อหาที่อาจารย์จำกัดสิทธิ์โดยไม่ได้รับอนุญาต
          </li>
          <li>
            API key เก็บบนเซิร์ฟเวอร์เท่านั้น ไม่ส่งไปยังเบราว์เซอร์ของผู้ใช้
          </li>
        </ul>
      </section>
    </main>
  );
}
