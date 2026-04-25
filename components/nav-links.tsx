"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/studio", label: "สตูดิโอ" },
  { href: "/summary", label: "รายการสรุป" },
  { href: "/review", label: "ตารางทบทวน" },
  { href: "/exam", label: "ทำข้อสอบ" },
  { href: "/about", label: "เกี่ยวกับ" },
] as const;

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav
      className="flex min-h-0 min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="หลัก"
    >
      {nav.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-muted text-brand ring-1 ring-brand/25"
                : "text-black hover:bg-gray-50"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
