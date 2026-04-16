"use client";

import Link from "next/link";
import { ReviewPlanSavedList } from "./review-plan-saved-list";

export function ReviewPlanPageClient() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">ตารางทบทวนบทเรียน</p>
      <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-3xl">
        ตารางทบทวนบทเรียนทั้งหมด
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-neutral-700">
        ตารางที่สร้างจาก Dify ผ่านเทมเพลต &quot;ตาราง + เช็คความเข้าใจ&quot; ใน{" "}
        <Link href="/studio" className="font-medium text-brand underline hover:text-brand-hover">
          สตูดิโอ
        </Link>{" "}
        ขณะล็อกอินจะถูกบันทึกอัตโนมัติ — คลิกรายการเพื่อเปิดดูรายละเอียด
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-black">ตารางของฉัน</h2>
        <p className="mt-1 text-sm text-neutral-600">เรียงจากใหม่ไปเก่า — คลิกการ์ดเพื่อเปิดรายละเอียด</p>
        <div className="mt-4">
          <ReviewPlanSavedList />
        </div>
      </section>
    </div>
  );
}

