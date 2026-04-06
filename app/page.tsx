import type { ReactNode } from "react";
import Link from "next/link";
import { BrandHeroMark } from "@/components/brand-logo";

function IconBox({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-muted text-brand">
      {children}
    </span>
  );
}

const features = [
  {
    title: "ข้อสอบจำลอง",
    description:
      "ระบุวิชา ระดับความยาก และเนื้อหาอ้างอิง ให้ได้ชุดฝึกที่ตรวจทานกับสรุปของคุณได้",
    cta: "ไปที่สตูดิโอ",
    href: "/studio",
    icon: (
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v0z" />
        <path d="M9 12h6M9 16h6" />
      </svg>
    ),
  },
  {
    title: "ย่อยเนื้อหา",
    description:
      "ถอดความจากตำราหรือสรุปให้อ่านง่ายขึ้น โดยยังผูกกับข้อความต้นฉบับที่คุณวางไว้",
    cta: "ไปที่สตูดิโอ",
    href: "/studio",
    icon: (
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3v18" />
        <path d="M5.5 9.5 12 6l6.5 3.5" />
        <path d="M5.5 14.5 12 18l6.5-3.5" />
      </svg>
    ),
  },
  {
    title: "ตารางอ่านหนังสือ",
    description:
      "วางแผนตามเวลาที่มี พร้อมคำถามทบทวนหลังแต่ละช่วงก่อนสอบ",
    cta: "ไปที่สตูดิโอ",
    href: "/studio",
    icon: (
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    title: "รันในสตูดิโอ",
    description:
      "กดรันคำสั่งแล้วอ่านคำตอบจาก Dify ในหน้าเดียว — ยังคัดลอกคำสั่ง/คำตอบไปใช้ที่อื่นได้ถ้าต้องการ",
    cta: "ไปที่สตูดิโอ",
    href: "/studio",
    icon: (
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
  },
] as const;

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col bg-white px-5 pb-20 pt-12 text-black sm:px-6 sm:pb-28 sm:pt-16">
      <div className="mx-auto max-w-2xl text-center">
        <BrandHeroMark />
        <h1 className="mt-8 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          KU PromptLearn
        </h1>
        <p className="mt-3 text-lg font-medium text-brand">
          แพลตฟอร์มคำสั่งสำเร็จรูปสำหรับการเรียนและสอบของนิสิต
        </p>
        <p className="mt-4 text-pretty text-[17px] leading-relaxed text-black">
          เทมเพลตที่จัดโครงสร้างไว้แล้ว ช่วยให้คุณใช้ AI กับการสอบและการสรุปได้ตรงจุด
          โดยไม่ต้องเริ่มจากหน้าเปล่า
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/studio"
            className="inline-flex rounded-2xl bg-black px-7 py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800"
          >
            เปิดสตูดิโอ
          </Link>
          <Link
            href="/about"
            className="inline-flex rounded-2xl border border-gray-200 bg-white px-7 py-3.5 text-sm font-medium text-black shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
          >
            อ่านเพิ่มเติม
          </Link>
        </div>
      </div>

      <ul className="mx-auto mt-20 grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2">
        {features.map((item) => (
          <li key={item.title}>
            <article className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 text-black shadow-sm transition hover:border-gray-300 hover:shadow-md">
              <IconBox>{item.icon}</IconBox>
              <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-black">
                {item.description}
              </p>
              <Link
                href={item.href}
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-hover"
              >
                {item.cta}
                <span aria-hidden className="text-base leading-none">
                  ›
                </span>
              </Link>
            </article>
          </li>
        ))}
      </ul>
    </main>
  );
}
