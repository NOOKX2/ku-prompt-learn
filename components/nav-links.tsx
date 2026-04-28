"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/studio", label: "สตูดิโอ" },
  { href: "/exam", label: "ทำข้อสอบ" },
  { href: "/summary", label: "รายการสรุป" },
  { href: "/review", label: "ตารางทบทวน" },
  { href: "/community", label: "ชุมชน" },
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
            className={`relative shrink-0 border-b-2 px-2.5 py-2 text-sm font-semibold transition-colors ${
              active
                ? "border-brand text-brand"
                : "border-transparent text-neutral-700 hover:text-brand"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
