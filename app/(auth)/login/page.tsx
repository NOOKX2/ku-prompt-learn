import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BrandHeroMark } from "@/components/brand-logo";
import { isGoogleOAuthConfigured } from "@/lib/auth-env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ",
  description: "เข้าสู่ระบบ KU PromptLearn ด้วยอีเมลหรือ Google",
};

export default function LoginPage() {
  const showGoogle = isGoogleOAuthConfigured();

  return (
    <>
      <div className="flex flex-col items-center text-center">
        <BrandHeroMark />
        <p className="mt-3 text-base font-bold text-brand sm:text-lg">KU PromptLearn</p>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-neutral-900">เข้าสู่ระบบ</h1>
        <p className="mt-2 text-sm text-neutral-500">ยินดีต้อนรับกลับมา</p>
      </div>

      <div className="mt-8">
        <Suspense fallback={<p className="text-center text-sm text-neutral-500">กำลังโหลดฟอร์ม…</p>}>
          <LoginForm showGoogle={showGoogle} />
        </Suspense>
      </div>

      <p className="mt-8 text-center text-sm text-neutral-600">
        ยังไม่มีบัญชี?{" "}
        <Link href="/register" className="font-semibold text-brand hover:text-brand-hover">
          สมัครสมาชิก
        </Link>
      </p>
    </>
  );
}
