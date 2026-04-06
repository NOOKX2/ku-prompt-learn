"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogoLink } from "@/components/brand-logo";

const nav = [
  { href: "/", label: "หน้าแรก" },
  { href: "/studio", label: "สตูดิโอ" },
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
      <div className="mx-auto grid w-full max-w-5xl grid-cols-[1fr_auto] grid-rows-[auto_auto] items-center gap-x-3 gap-y-2 px-5 py-3 sm:grid-cols-[auto_1fr_auto] sm:grid-rows-1 sm:gap-4 sm:px-6 sm:py-3.5">
        <div className="col-start-1 row-start-1 min-w-0">
          <BrandLogoLink />
        </div>

        <nav
          className="col-span-2 col-start-1 row-start-2 flex flex-wrap justify-center gap-1 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:justify-center"
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
                className={linkClass(active)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/studio"
          className="col-start-2 row-start-1 justify-self-end rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          เปิดสตูดิโอ
        </Link>
      </div>
    </header>
  );
}
