"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  AuthDivider,
  AuthEmailField,
  AuthPasswordField,
  GoogleGlyph,
} from "@/components/auth/auth-fields";
import { loginAction, signInWithGoogleAction } from "../../actions";
import { AUTH_FORM_INITIAL, type AuthFormState } from "../../auth-types";

type Props = {
  showGoogle: boolean;
};

function SubmitLabel({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return <>{pending ? busy : idle}</>;
}

export function LoginForm({ showGoogle }: Props) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [state, formAction] = useActionState<AuthFormState, FormData>(loginAction, AUTH_FORM_INITIAL);

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-neutral-600">
            อีเมล
          </label>
          <AuthEmailField
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="name@example.com"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="login-password" className="text-sm font-medium text-neutral-600">
              รหัสผ่าน
            </label>
            <span
              className="text-xs text-neutral-400"
              title="ฟีเจอร์รีเซ็ตรหัสผ่านจะเพิ่มในภายหลัง"
            >
              ลืมรหัสผ่าน?
            </span>
          </div>
          <AuthPasswordField
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
          />
        </div>

        {state.error ? (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover disabled:opacity-60"
        >
          <SubmitLabel idle="เข้าสู่ระบบ" busy="กำลังเข้าสู่ระบบ…" />
        </button>
      </form>

      {showGoogle ? (
        <>
          <AuthDivider label="หรือดำเนินการต่อด้วย" />
          <form action={signInWithGoogleAction}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50 disabled:opacity-60"
            >
              <GoogleGlyph className="size-5 shrink-0" />
              <GoogleSubmitLabel />
            </button>
          </form>
        </>
      ) : null}
    </div>
  );
}

function GoogleSubmitLabel() {
  const { pending } = useFormStatus();
  return <>{pending ? "กำลังเชื่อมต่อ…" : "เชื่อมต่อด้วย Google"}</>;
}
