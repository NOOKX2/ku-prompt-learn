import type { Metadata } from "next";
import Link from "next/link";
import { BrandHeroMark } from "@/components/brand-logo";
import { isGoogleOAuthConfigured } from "@/lib/auth-env";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "ลงทะเบียน",
  description: "สร้างบัญชี KU PromptLearn",
};

export default function RegisterPage() {
  const showGoogle = isGoogleOAuthConfigured();

  return (
    <>
      <div className="flex flex-col items-center text-center">
        <BrandHeroMark />
        <p className="mt-3 text-base font-bold text-brand sm:text-lg">KU PromptLearn</p>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-neutral-900">สร้างบัญชี</h1>
        <p className="mt-2 text-sm text-neutral-500">เริ่มใช้งานเทมเพลตและสตูดิโอได้ทันที</p>
      </div>

      <div className="mt-8">
        <RegisterForm showGoogle={showGoogle} />
      </div>

      <p className="mt-8 text-center text-sm text-neutral-600">
        มีบัญชีแล้ว?{" "}
        <Link href="/login" className="font-semibold text-brand hover:text-brand-hover">
          เข้าสู่ระบบ
        </Link>
      </p>
    </>
  );
}
