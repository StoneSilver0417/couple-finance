import type { Metadata } from "next";
import { Manrope, Nunito } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "부부 공동 가계부 | 투명하고 스마트한 자산 관리",
  description:
    "부부가 함께 관리하는 투명한 우리 집 가계부. 수입, 지출, 예산, 자산을 한눈에 확인하세요.",
  manifest: "/manifest.json",
  themeColor: "#ff85a2",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "부부 가계부",
  },
};

import { BottomNav } from "@/components/layout/bottom-nav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${manrope.variable} ${nunito.variable} font-sans antialiased bg-[#FDFDFD] text-[#2D2D5F] min-h-screen selection:bg-primary-soft selection:text-text-main`}
      >
        <div className="relative flex h-full w-full flex-col overflow-x-hidden max-w-md mx-auto min-h-screen pb-28 bg-mesh shadow-[0_0_50px_-12px_rgba(0,0,0,0.1)]">
          {children}
          <BottomNav />
        </div>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
