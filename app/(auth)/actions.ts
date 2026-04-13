"use server";

import { CredentialsSignin } from "next-auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import type { AuthFormState } from "./auth-types";
import { prisma } from "@/lib/prisma";

export type { AuthFormState } from "./auth-types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const emailRaw = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nameRaw = String(formData.get("name") ?? "").trim();

  const emailNorm = emailRaw.toLowerCase();
  if (!emailNorm || !password) {
    return { error: "ต้องมีอีเมลและรหัสผ่าน" };
  }
  if (!EMAIL_RE.test(emailNorm)) {
    return { error: "รูปแบบอีเมลไม่ถูกต้อง" };
  }
  if (password.length < 8) {
    return { error: "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร" };
  }

  const nameStr = nameRaw ? nameRaw.slice(0, 120) : null;

  const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (existing) {
    return { error: "อีเมลนี้ลงทะเบียนแล้ว" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email: emailNorm,
      passwordHash,
      name: nameStr,
    },
  });

  const callbackUrl = String(formData.get("callbackUrl") ?? "/") || "/";
  try {
    await signIn("credentials", {
      email: emailNorm,
      password,
      redirect: false,
      redirectTo: callbackUrl,
    });
  } catch (e) {
    if (e instanceof CredentialsSignin) {
      return {
        error: "สร้างบัญชีแล้ว แต่เข้าสู่ระบบไม่สำเร็จ — ลองเข้าสู่ระบบด้วยตนเอง",
      };
    }
    throw e;
  }

  redirect(callbackUrl);
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/") || "/";

  if (!email || !password) {
    return { error: "กรอกอีเมลและรหัสผ่าน" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
      redirectTo: callbackUrl,
    });
  } catch (e) {
    if (e instanceof CredentialsSignin) {
      return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }
    throw e;
  }

  redirect(callbackUrl);
}

export async function signInWithGoogleAction(): Promise<void> {
  await signIn("google", { redirectTo: "/" });
}
