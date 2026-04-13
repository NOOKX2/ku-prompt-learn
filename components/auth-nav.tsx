"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import { AuthUserDropdown } from "@/components/auth-user-dropdown";

export function AuthNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <span className="text-xs text-neutral-500 sm:text-sm" aria-live="polite">
        กำลังโหลด…
      </span>
    );
  }

  if (session?.user) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <AuthUserDropdown />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="rounded-xl px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-gray-50 sm:text-sm"
      >
        เข้าสู่ระบบ
      </Link>
    </div>
  );
}
