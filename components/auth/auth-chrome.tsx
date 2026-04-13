import type { ReactNode } from "react";
import { BrandLogoLink } from "@/components/brand-logo";

export function AuthChromeHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center px-5 sm:h-16 sm:px-6">
        <BrandLogoLink />
      </div>
    </header>
  );
}

export function AuthChromeFooter() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white py-6">
      <div className="mx-auto max-w-5xl px-5 text-center text-xs leading-relaxed text-neutral-500 sm:px-6">
        KU PromptLearn · เครื่องมือส่วนบุคคลสำหรับการทบทวน — โครงสร้าง prompt ใช้ได้กับหลายผู้ให้บริการ LLM
      </div>
    </footer>
  );
}

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[420px] rounded-2xl border border-gray-100 bg-white px-6 py-8 shadow-xl shadow-neutral-300/40 sm:px-8 sm:py-10">
      {children}
    </div>
  );
}
