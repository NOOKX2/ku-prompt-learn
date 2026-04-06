import type { Metadata } from "next";
import { Geist_Mono, Sarabun } from "next/font/google";
import { SiteShell } from "@/components/site-shell";
import "./globals.css";

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "KU PromptLearn",
    template: "%s · KU PromptLearn",
  },
  description:
    "คลังชุดคำสั่งสำหรับการเรียนในมหาวิทยาลัยเกษตรศาสตร์ — ข้อสอบจำลอง ย่อยเนื้อหา และตารางอ่านหนังสือ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${sarabun.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white font-sans text-black antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
