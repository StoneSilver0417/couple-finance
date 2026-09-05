import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";

type AppLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-mesh pb-[calc(9rem+env(safe-area-inset-bottom))] shadow-[0_0_50px_-12px_rgba(0,0,0,0.1)]">
      {children}
      <BottomNav />
    </div>
  );
}
