"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

type User = {
  name?: string | null;
  email?: string | null;
};

function IconUserSolid({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

function IconGear({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconUserOutline({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconLogOut({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function AuthUserDropdown({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const name = user.name?.trim();
  const email = user.email ?? "";
  const displayName = name || email.split("@")[0] || "ผู้ใช้";

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex max-w-[min(100vw-8rem,16rem)] items-center gap-2 rounded-xl border border-gray-200 bg-white py-1.5 pl-1.5 pr-2 text-left shadow-sm transition hover:bg-gray-50 sm:max-w-[18rem] sm:gap-2.5 sm:py-2 sm:pl-2 sm:pr-3"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-white sm:size-9">
          <IconUserSolid className="size-[18px] sm:size-5" />
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-neutral-900 sm:text-sm">{displayName}</span>
        <IconChevronDown className={`size-4 shrink-0 text-neutral-500 transition-transform sm:size-[18px] ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[min(calc(100vw-2.5rem),17rem)] rounded-xl border border-gray-100 bg-white py-2 shadow-lg shadow-neutral-200/80"
        >
          <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wide text-neutral-400">จัดการบัญชี</p>

          <Link
            href="/studio"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-800 transition hover:bg-gray-50"
          >
            <IconGear className="size-4 shrink-0 text-neutral-500" />
            โปรไฟล์ของฉัน
          </Link>
          <Link
            href="/about"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-800 transition hover:bg-gray-50"
          >
            <IconUserOutline className="size-4 shrink-0 text-neutral-500" />
            เกี่ยวกับ
          </Link>

          <div className="my-1 border-t border-gray-100" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void signOut({ callbackUrl: "/" });
            }}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <IconLogOut className="size-4 shrink-0" />
            ออกจากระบบ
          </button>
        </div>
      ) : null}
    </div>
  );
}
