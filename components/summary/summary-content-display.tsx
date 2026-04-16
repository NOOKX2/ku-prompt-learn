import type { SimplifySummary } from "@/lib/simplify-summary";

export function SummaryContentDisplay({ data }: { data: SimplifySummary }) {
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">สรุปจาก JSON</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-black sm:text-3xl">
          {data.topic}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-700">
          <span className="rounded-full bg-brand-muted/60 px-2.5 py-1 ring-1 ring-brand/20">
            Tone: {data.tone}
          </span>
          <span className="rounded-full bg-brand-muted/60 px-2.5 py-1 ring-1 ring-brand/20">
            ความยาว: {data.length}
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-neutral-200">
            Version: {data.summaryVersion}
          </span>
        </div>
      </header>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-black">แกนเรื่องสำคัญ</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-900">
          {data.corePoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-black">อธิบายทีละขั้น</h2>
        <ol className="mt-4 space-y-4">
          {data.explanationSteps.map((step) => (
            <li key={step.title} className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
              <p className="font-semibold text-black">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-neutral-800">{step.detail}</p>
              {step.example ? (
                <p className="mt-2 text-xs text-neutral-600">ตัวอย่าง: {step.example}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-black">จุดเชื่อมกับข้อสอบ</h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-900">{data.examConnection}</p>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-black">คำศัพท์สำคัญ</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.keywords.map((k) => (
            <article key={k.term} className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
              <p className="font-semibold text-black">{k.term}</p>
              <p className="mt-1 text-sm leading-relaxed text-neutral-700">{k.definition}</p>
            </article>
          ))}
        </div>
      </section>

      {data.needsMoreInfo ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950">
          <p className="text-sm font-semibold">ยังต้องการข้อมูลเพิ่ม</p>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {data.missingInfo.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
