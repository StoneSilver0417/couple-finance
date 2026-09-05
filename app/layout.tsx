import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: "#ff85a2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "부부 공동 가계부 | 투명하고 스마트한 자산 관리",
  description:
    "부부가 함께 관리하는 투명한 우리 집 가계부. 수입, 지출, 예산, 자산을 한눈에 확인하세요.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "부부 가계부",
  },
};

import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { PwaRegister } from "@/components/pwa-register";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${manrope.variable} ${nunito.variable} min-h-dvh bg-[#FDFDFD] font-sans text-[#2D2D5F] antialiased selection:bg-primary-soft selection:text-text-main`}
      >
        <ConfirmProvider>
          {children}
          <Toaster position="top-center" richColors />
          <PwaRegister />
        </ConfirmProvider>
      </body>
    </html>
  );
}
