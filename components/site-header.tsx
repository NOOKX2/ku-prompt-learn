"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthNav } from "@/components/auth-nav";
import { BrandLogoLink } from "@/components/brand-logo";

const nav = [
  { href: "/", label: "หน้าแรก" },
  { href: "/studio", label: "สตูดิโอ" },
  { href: "/exam", label: "ทำข้อสอบ" },
  { href: "/about", label: "เกี่ยวกับ" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  const linkClass = (active: boolean) =>
    `rounded-xl px-3 py-2 text-sm font-medium transition-colors ${active
      ? "bg-brand-muted text-black"
      : "text-black hover:bg-gray-50"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-md">
      {/* แถบเดียว — ไม่แยกแถวโลโก้/ลิงก์แบบ grid สองแถว (เคยดูเหมือน navbar ซ้อน) */}
      <div className="mx-auto flex max-w-5xl flex-nowrap items-center gap-2 px-5 py-3 sm:gap-4 sm:px-6 sm:py-3.5">
        <div className="shrink-0">
          <BrandLogoLink />
        </div>

        <nav
          className="flex min-h-0 min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="หลัก"
        >
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 ${linkClass(active)}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <AuthNav />
          <Link
            href="/studio"
            className="shrink-0 rounded-xl bg-black px-3 py-2 text-xs font-medium text-white transition hover:bg-neutral-800 sm:px-4 sm:text-sm"
          >
            เปิดสตูดิโอ
          </Link>
        </div>
      </div>
    </header>
  );
}
