import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "ชุมชน — เนื้อหาสาธารณะ",
  description: "ข้อสอบ สรุป และตารางทบทวนที่สมาชิกแบ่งปันให้ทุกคน",
};

export const runtime = "nodejs";

export default async function CommunityPage() {
  const [exams, summaries, plans] = await Promise.all([
    prisma.exam.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, title: true, createdAt: true, user: { select: { name: true } } },
    }),
    prisma.summary.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, topic: true, createdAt: true, user: { select: { name: true } } },
    }),
    prisma.reviewPlan.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, title: true, createdAt: true, user: { select: { name: true } } },
    }),
  ]);

  const isEmpty = exams.length === 0 && summaries.length === 0 && plans.length === 0;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-black">ชุมชน</h1>
        <p className="text-sm text-neutral-500">เนื้อหาที่สมาชิกแบ่งปันให้ทุกคน — ข้อสอบ สรุป และตารางทบทวน</p>
      </div>

      {isEmpty ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 px-6 py-14 text-center">
          <p className="text-sm text-neutral-500">ยังไม่มีเนื้อหาสาธารณะ</p>
          <p className="mt-1 text-xs text-neutral-400">
            เปิดเผยแพร่ข้อสอบ สรุป หรือตารางทบทวนจากหน้ารายละเอียด แล้วเนื้อหาจะปรากฏที่นี่
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {exams.length > 0 && (
            <section>
              <h2 className="mb-4 text-base font-semibold text-black">
                ข้อสอบ
                <span className="ml-2 rounded-full bg-brand-muted/60 px-2 py-0.5 text-xs font-medium text-brand">
                  {exams.length}
                </span>
              </h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {exams.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/exam/${e.id}`}
                      className="group flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-700">
                          MCQ
                        </div>
                        <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                          สาธารณะ
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm font-semibold text-black group-hover:text-brand">
                        {e.title}
                      </p>
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span>{e.user.name ?? "ผู้ใช้"}</span>
                        <span>
                          {new Date(e.createdAt).toLocaleDateString("th-TH", { dateStyle: "medium" })}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {summaries.length > 0 && (
            <section>
              <h2 className="mb-4 text-base font-semibold text-black">
                สรุปเนื้อหา
                <span className="ml-2 rounded-full bg-brand-muted/60 px-2 py-0.5 text-xs font-medium text-brand">
                  {summaries.length}
                </span>
              </h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {summaries.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/summary/${s.id}`}
                      className="group flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-[11px] font-bold text-red-700">
                          PDF
                        </div>
                        <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                          สาธารณะ
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm font-semibold text-black group-hover:text-brand">
                        {s.topic}
                      </p>
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span>{s.user.name ?? "ผู้ใช้"}</span>
                        <span>
                          {new Date(s.createdAt).toLocaleDateString("th-TH", { dateStyle: "medium" })}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {plans.length > 0 && (
            <section>
              <h2 className="mb-4 text-base font-semibold text-black">
                ตารางทบทวน
                <span className="ml-2 rounded-full bg-brand-muted/60 px-2 py-0.5 text-xs font-medium text-brand">
                  {plans.length}
                </span>
              </h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {plans.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/review/${p.id}`}
                      className="group flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-[10px] font-bold text-emerald-700">
                          PLAN
                        </div>
                        <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                          สาธารณะ
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm font-semibold text-black group-hover:text-brand">
                        {p.title}
                      </p>
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span>{p.user.name ?? "ผู้ใช้"}</span>
                        <span>
                          {new Date(p.createdAt).toLocaleDateString("th-TH", { dateStyle: "medium" })}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
