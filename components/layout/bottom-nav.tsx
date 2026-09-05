"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, Plus, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(path + "/");

  // Dynamic Plus Link Logic
  let plusHref = "/transactions/new";
  if (pathname?.startsWith("/assets")) {
    plusHref = "/assets/new";
  } else if (pathname?.startsWith("/settings/categories")) {
    plusHref = "/settings/categories?mode=add";
  } else if (pathname?.startsWith("/settings/budgets")) {
    plusHref = "/settings/budgets?mode=add";
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pt-7 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto relative h-20">
        {/* Floating Plus Button */}
        <div className="absolute left-1/2 -top-7 -translate-x-1/2 z-20 pointer-events-auto">
          <Link
            href={plusHref}
            aria-label="새 항목 추가"
            className="group flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-primary-dark to-primary text-white rounded-full shadow-lg shadow-primary/40 border-[6px] border-[#FDFDFD] transition-all hover:scale-110 active:scale-95"
            scroll={false}
          >
            <Plus className="w-8 h-8 font-bold" strokeWidth={3} aria-hidden="true" />
          </Link>
        </div>

        {/* Navigation Bar */}
        <nav aria-label="주요 메뉴" className="glass-panel pointer-events-auto relative z-10 flex h-full w-full items-center justify-between rounded-full border-white/80 px-6 shadow-2xl">
          <Link
            href="/"
            aria-label="대시보드"
            aria-current={pathname === "/" ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all active:scale-90 duration-100",
              pathname === "/"
                ? "text-primary-dark bg-primary-soft/20 scale-110"
                : "text-text-secondary hover:text-primary-dark",
            )}
            prefetch={true}
          >
            <Home
              className={cn("w-7 h-7", pathname === "/" && "fill-current")}
              aria-hidden="true"
            />
          </Link>

          <Link
            href="/transactions"
            aria-label="거래 내역"
            aria-current={isActive("/transactions") ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all",
              isActive("/transactions")
                ? "text-primary-dark scale-110"
                : "text-text-secondary hover:text-primary-dark",
            )}
          >
            <Receipt
              className={cn(
                "w-7 h-7",
                isActive("/transactions") && "fill-current",
              )}
              aria-hidden="true"
            />
          </Link>

          {/* Spacer for the floating button */}
          <div className="w-16 h-16" />

          <Link
            href="/assets"
            aria-label="자산"
            aria-current={isActive("/assets") ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all",
              isActive("/assets")
                ? "text-primary-dark"
                : "text-text-secondary hover:text-primary-dark",
            )}
          >
            <Wallet
              className={cn("w-7 h-7", isActive("/assets") && "fill-current")}
              aria-hidden="true"
            />
          </Link>

          <Link
            href="/settings"
            aria-label="설정"
            aria-current={pathname === "/settings" ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all",
              pathname === "/settings"
                ? "text-primary-dark"
                : "text-text-secondary hover:text-primary-dark",
            )}
          >
            <User
              className={cn(
                "w-7 h-7",
                pathname === "/settings" && "fill-current",
              )}
              aria-hidden="true"
            />
          </Link>
        </nav>
      </div>
    </div>
  );
}
