import type { ReviewPlan } from "@/lib/review-plan-json";

export function ReviewPlanContentDisplay({ data }: { data: ReviewPlan }) {
  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          ตารางทบทวนบทเรียน
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-black sm:text-3xl">
          {data.title}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-700">
          <span className="rounded-full bg-brand-muted/60 px-2.5 py-1 ring-1 ring-brand/20">
            วิชา: {data.subject}
          </span>
          <span className="rounded-full bg-brand-muted/60 px-2.5 py-1 ring-1 ring-brand/20">
            วันสอบ/กรอบ: {data.examDate}
          </span>
          {data.hoursPerDay ? (
            <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-neutral-200">
              อ่านต่อวัน: {data.hoursPerDay} ชม.
            </span>
          ) : null}
        </div>
      </header>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-black">ตารางอ่านหนังสือ</h2>
        <div className="mt-5 space-y-5">
          {data.schedule.map((day, idx) => {
            const label = day.label || `Day ${day.dayIndex ?? idx + 1}`;
            return (
              <article
                key={`${day.dayIndex ?? idx}-${label}`}
                className="rounded-xl border border-neutral-200 bg-neutral-50/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-black">{label}</p>
                    {day.date ? (
                      <p className="mt-1 text-xs text-neutral-600">{day.date}</p>
                    ) : null}
                  </div>
                  {day.dailyChecklist?.length ? (
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs text-neutral-700 ring-1 ring-neutral-200">
                      มี {day.dailyChecklist.length} เช็ค
                    </span>
                  ) : null}
                </div>

                {day.sessions?.length ? (
                  <div className="mt-4 space-y-4">
                    {day.sessions.map((s, sIdx) => {
                      const topics = s.topics ?? [];
                      const qs = s.reviewQuestions ?? [];
                      return (
                        <div
                          key={`${idx}-${sIdx}-${s.timeRange ?? ""}`}
                          className="rounded-lg border border-neutral-200 bg-white p-4"
                        >
                          {s.timeRange ? (
                            <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                              {s.timeRange}
                            </p>
                          ) : null}

                          {topics.length ? (
                            <div className="mt-2">
                              <p className="text-sm font-semibold text-black">หัวข้อ</p>
                              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-neutral-900">
                                {topics.map((t) => (
                                  <li key={t}>{t}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}

                          {qs.length ? (
                            <div className="mt-3">
                              <p className="text-sm font-semibold text-black">คำถามทบทวน</p>
                              <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-neutral-900">
                                {qs.map((q) => (
                                  <li key={q}>{q}</li>
                                ))}
                              </ol>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-neutral-600">ไม่มีรายละเอียดช่วงอ่านในวันนี้</p>
                )}

                {day.dailyChecklist?.length ? (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-black">Daily checklist</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-900">
                      {day.dailyChecklist.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-amber-950">Checklist รีวิวรวมก่อนสอบ</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-950">
          {data.reviewChecklist.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

