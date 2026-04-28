import Link from "next/link";

type Props = {
  searchParams: Promise<{ correct?: string; total?: string }>;
};

export default async function PublicExamResultPage({ searchParams }: Props) {
  const sp = await searchParams;
  const correct = Number.parseInt(sp.correct ?? "0", 10);
  const total = Number.parseInt(sp.total ?? "0", 10);
  const c = Number.isFinite(correct) && correct >= 0 ? correct : 0;
  const t = Number.isFinite(total) && total >= 0 ? total : 0;
  const pct = t > 0 ? Math.round((100 * c) / t) : 0;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">สรุปคะแนน</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">ผลการทำข้อสอบ</h1>
        <p className="mt-1 text-sm text-neutral-500">โหมดสาธารณะ (ไม่ได้บันทึกคะแนนลงบัญชี)</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs text-neutral-500">คะแนนเปอร์เซ็นต์</p>
            <p className="mt-1 text-2xl font-bold text-brand">{pct}%</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs text-neutral-500">ตอบถูกปรนัย</p>
            <p className="mt-1 text-2xl font-bold text-black">
              {c}/{t}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/exam"
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
          >
            กลับไปรายการข้อสอบ
          </Link>
        </div>
      </div>
    </div>
  );
}
