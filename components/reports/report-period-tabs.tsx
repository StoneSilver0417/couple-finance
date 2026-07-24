"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export type ReportPeriodType = "month" | "quarter" | "half" | "year";

interface ReportPeriodTabsProps {
  activeType: ReportPeriodType;
  currentPeriodKeys: Record<ReportPeriodType, string>;
}

const PERIOD_OPTIONS: Array<{
  type: ReportPeriodType;
  label: string;
}> = [
  { type: "month", label: "월" },
  { type: "quarter", label: "분기" },
  { type: "half", label: "반기" },
  { type: "year", label: "연간" },
];

export function ReportPeriodTabs({
  activeType,
  currentPeriodKeys,
}: ReportPeriodTabsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <nav
      aria-label="보고서 기간 유형"
      aria-busy={isPending}
      className="mb-4 grid grid-cols-4 gap-1 rounded-full bg-black/5 p-1"
    >
      {PERIOD_OPTIONS.map((option) => {
        const active = option.type === activeType;
        return (
          <button
            key={option.type}
            type="button"
            aria-current={active ? "page" : undefined}
            disabled={isPending}
            onClick={() => {
              if (active) return;
              startTransition(() => {
                router.push(`/reports/${currentPeriodKeys[option.type]}`);
              });
            }}
            className={`min-h-11 min-w-11 cursor-pointer rounded-full px-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2 disabled:cursor-wait ${
              active
                ? "bg-white text-slate-900 shadow-sm"
                : "text-text-secondary hover:bg-white/50 hover:text-text-main"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </nav>
  );
}
