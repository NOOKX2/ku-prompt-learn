import Link from "next/link";
import { auth } from "@/auth";
import { BrandLogoLink } from "@/components/brand-logo";
import { NavLinks } from "@/components/nav-links";
import { AuthUserDropdown } from "@/components/auth-user-dropdown";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user ?? null;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-nowrap items-center gap-2 px-5 py-3 sm:gap-4 sm:px-6 sm:py-3.5">
        <div className="shrink-0">
          <BrandLogoLink />
        </div>

        <NavLinks />

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {user ? (
            <AuthUserDropdown user={user} />
          ) : (
            <Link
              href="/login"
              className="rounded-xl px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-gray-50 sm:text-sm"
            >
              เข้าสู่ระบบ
            </Link>
          )}
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
