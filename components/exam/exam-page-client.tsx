"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  EXAM_JSON_STORAGE_KEY,
  parseExamJson,
  type ParseExamResult,
} from "@/lib/exam-json";
import { ExamRunner } from "./exam-runner";

export function ExamPageClient() {
  const [raw, setRaw] = useState("");
  const [loadedFromStorage, setLoadedFromStorage] = useState(false);

  useEffect(() => {
    try {
      const s = sessionStorage.getItem(EXAM_JSON_STORAGE_KEY);
      if (s?.trim()) {
        setRaw(s);
        setLoadedFromStorage(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const parsed: ParseExamResult = useMemo(() => parseExamJson(raw), [raw]);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 text-black sm:px-8 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">ทำข้อสอบ</p>
      <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-3xl">หน้าข้อสอบจาก JSON</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-neutral-700">
        วาง JSON ที่ได้จาก Dify (เทมเพลตข้อสอบจำลอง) หรือกด{" "}
        <Link href="/studio" className="font-medium text-brand underline hover:text-brand-hover">
          เปิดจากสตูดิโอ
        </Link>{" "}
        หลังรันคำสั่ง — ระบบจะโหลดคำตอบล่าสุดจากเซสชันนี้ให้อัตโนมัติ
        {loadedFromStorage ? (
          <span className="text-neutral-500"> (โหลดจากสตูดิโอแล้ว)</span>
        ) : null}
      </p>

      <div className="mt-8 space-y-3">
        <label htmlFor="exam-json" className="block text-sm font-medium text-black">
          JSON ข้อสอบ
        </label>
        <textarea
          id="exam-json"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={10}
          className="w-full resize-y rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 font-mono text-xs leading-relaxed text-neutral-900 outline-none ring-brand/20 focus:border-brand focus:ring-2 sm:text-sm"
          placeholder='วาง JSON หรือข้อความที่มีบล็อก ```json ... ```'
          spellCheck={false}
        />
        {!parsed.ok ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {parsed.error}
          </p>
        ) : null}
      </div>

      {parsed.ok ? (
        <div className="mt-10">
          <ExamRunner exam={parsed.exam} />
        </div>
      ) : null}
    </div>
  );
}
