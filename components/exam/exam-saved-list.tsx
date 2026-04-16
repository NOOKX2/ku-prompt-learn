import Link from "next/link";

export type ExamSummary = {
  id: string;
  title: string;
  score: number | null;
  createdAt: string;
};

type Props = {
  signedIn: boolean;
  exams: ExamSummary[];
};

export function ExamSavedList({ signedIn, exams }: Props) {
  if (!signedIn) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
        <Link href="/login" className="font-medium text-brand underline hover:text-brand-hover">
          เข้าสู่ระบบ
        </Link>{" "}
        เพื่อดูข้อสอบที่สร้างจากสตูดิโอ (เทมเพลตข้อสอบจำลอง) และบันทึกอัตโนมัติหลัง Dify ตอบกลับ
      </p>
    );
  }

  if (exams.length === 0) {
    return (
      <p className="text-sm text-neutral-600">
        ยังไม่มีข้อสอบที่บันทึก — รันเทมเพลต &quot;ข้อสอบจำลอง&quot; ใน{" "}
        <Link href="/studio" className="font-medium text-brand underline hover:text-brand-hover">
          สตูดิโอ
        </Link>{" "}
        ขณะล็อกอิน ระบบจะเก็บคำตอบจาก Dify ให้
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {exams.map((e) => (
        <li key={e.id} className="min-w-0">
          <Link
            href={`/exam/${e.id}`}
            className="group block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
          >
            <div className="border-b border-neutral-200 bg-neutral-50/70 p-3">
              <div className="mx-auto flex aspect-4/3 w-full max-w-[220px] items-center justify-center rounded-xl border border-neutral-300 bg-white shadow-xs">
                <div className="w-[72%] rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-center">
                  <div className="mx-auto mb-2 h-8 w-8 rounded-md bg-indigo-500 text-[10px] font-bold leading-8 text-white">
                    EXAM
                  </div>
                  <p className="line-clamp-3 text-[11px] font-medium leading-tight text-neutral-700">
                    {e.title}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 p-4">
              <p className="line-clamp-2 text-sm font-semibold text-black group-hover:text-brand">
                {e.title}
              </p>
              <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
                <span>
                  {new Date(e.createdAt).toLocaleString("th-TH", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                {e.score != null ? (
                  <span className="rounded-full bg-brand-muted/60 px-2 py-0.5 text-[11px] font-medium text-brand">
                    คะแนน {e.score}%
                  </span>
                ) : (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                    ยังไม่ทำ
                  </span>
                )}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
