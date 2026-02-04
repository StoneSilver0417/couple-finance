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
  } else if (pathname?.startsWith("/settings/payment-methods")) {
    plusHref = "/settings/payment-methods?mode=add";
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pointer-events-none" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
      <div className="max-w-md mx-auto relative h-20">
        {/* Floating Plus Button */}
        <div className="absolute left-1/2 -top-7 -translate-x-1/2 z-20 pointer-events-auto">
          <Link
            href={plusHref}
            className="group flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-primary-dark to-primary text-white rounded-full shadow-lg shadow-primary/40 border-[6px] border-[#FDFDFD] transition-all hover:scale-110 active:scale-95"
            scroll={false}
          >
            <Plus className="w-8 h-8 font-bold" strokeWidth={3} />
          </Link>
        </div>

        {/* Navigation Bar */}
        <nav className="glass-panel w-full h-full rounded-full flex items-center justify-between px-6 shadow-2xl border-white/80 pointer-events-auto relative z-10">
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all",
              pathname === "/"
                ? "text-primary-dark bg-primary-soft/20 scale-110"
                : "text-text-secondary hover:text-primary-dark",
            )}
          >
            <Home
              className={cn("w-7 h-7", pathname === "/" && "fill-current")}
            />
          </Link>

          <Link
            href="/transactions"
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
            />
          </Link>

          {/* Spacer for the floating button */}
          <div className="w-16 h-16" />

          <Link
            href="/assets"
            className={cn(
              "flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all",
              isActive("/assets")
                ? "text-primary-dark"
                : "text-text-secondary hover:text-primary-dark",
            )}
          >
            <Wallet
              className={cn("w-7 h-7", isActive("/assets") && "fill-current")}
            />
          </Link>

          <Link
            href="/settings"
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
            />
          </Link>
        </nav>
      </div>
    </div>
  );
}
