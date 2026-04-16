import Link from "next/link";
import { SummarySavedList, type SummaryListItem } from "./summary-saved-list";

type Props = {
  signedIn: boolean;
  summaries: SummaryListItem[];
};

export function SummaryPageClient({ signedIn, summaries }: Props) {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">สรุปเนื้อหา</p>
      <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-3xl">รายการสรุปทั้งหมด</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-neutral-700">
        สรุปที่สร้างจาก Dify ผ่านเทมเพลต &quot;ย่อยเนื้อหา&quot; ใน{" "}
        <Link href="/studio" className="font-medium text-brand underline hover:text-brand-hover">
          สตูดิโอ
        </Link>{" "}
        ขณะล็อกอินจะถูกบันทึกอัตโนมัติ — คลิกรายการเพื่อเปิดดูรายละเอียดสรุป
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-black">สรุปของฉัน</h2>
        <p className="mt-1 text-sm text-neutral-600">
          เรียงจากใหม่ไปเก่า — คลิกการ์ดเพื่อเปิดรายละเอียด
        </p>
        <div className="mt-4">
          <SummarySavedList signedIn={signedIn} summaries={summaries} />
        </div>
      </section>
    </div>
  );
}
