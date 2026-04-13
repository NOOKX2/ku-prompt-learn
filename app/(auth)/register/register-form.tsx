"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  AuthDivider,
  AuthEmailField,
  AuthNameField,
  AuthPasswordField,
  GoogleGlyph,
} from "@/components/auth/auth-fields";
import { registerAction, signInWithGoogleAction } from "../actions";
import { AUTH_FORM_INITIAL, type AuthFormState } from "../auth-types";

type Props = {
  showGoogle: boolean;
};

function SubmitLabel({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return <>{pending ? busy : idle}</>;
}

export function RegisterForm({ showGoogle }: Props) {
  const [state, formAction] = useActionState<AuthFormState, FormData>(
    registerAction,
    AUTH_FORM_INITIAL,
  );

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value="/" />

        <div>
          <label htmlFor="reg-name" className="mb-1.5 block text-sm font-medium text-neutral-600">
            ชื่อที่แสดง <span className="font-normal text-neutral-400">(ไม่บังคับ)</span>
          </label>
          <AuthNameField
            id="reg-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="ชื่อที่ใช้ในระบบ"
          />
        </div>

        <div>
          <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium text-neutral-600">
            อีเมล
          </label>
          <AuthEmailField
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium text-neutral-600">
            รหัสผ่าน <span className="font-normal text-neutral-400">(อย่างน้อย 8 ตัวอักษร)</span>
          </label>
          <AuthPasswordField
            id="reg-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
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
          <SubmitLabel idle="สร้างบัญชี" busy="กำลังสร้างบัญชี…" />
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
