import type { ReactNode } from "react";
import {
  AuthCard,
  AuthChromeFooter,
  AuthChromeHeader,
} from "@/components/auth/auth-chrome";

export default function AuthGroupLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full min-h-[100dvh] flex-1 flex-col">
      <AuthChromeHeader />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-14">
        <AuthCard>{children}</AuthCard>
      </div>
      <AuthChromeFooter />
    </div>
  );
}
