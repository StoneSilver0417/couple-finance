"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  transaction_date: string;
  memo: string | null;
  categories?: {
    name: string;
    icon: string;
    color: string;
  };
}

interface MonthlyCalendarProps {
  year: number;
  month: number;
  transactions: Transaction[];
  onDateClick: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function MonthlyCalendar({
  year,
  month,
  transactions,
  onDateClick,
  onMonthChange,
}: MonthlyCalendarProps) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Group transactions by date
  const txByDate = useMemo(() => {
    const map: Record<string, { income: number; expense: number; count: number }> = {};
    transactions.forEach((tx) => {
      const date = tx.transaction_date;
      if (!map[date]) {
        map[date] = { income: 0, expense: 0, count: 0 };
      }
      if (tx.type === "income") {
        map[date].income += tx.amount;
      } else {
        map[date].expense += tx.amount;
      }
      map[date].count++;
    });
    return map;
  }, [transactions]);

  // Calendar grid calculation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();

    const days: (number | null)[] = [];

    // Empty cells before first day
    for (let i = 0; i < startWeekday; i++) {
      days.push(null);
    }

    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }

    return days;
  }, [year, month]);

  const handlePrevMonth = () => {
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, month + 1);
    }
  };

  const formatAmount = (amount: number) => {
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}만`;
    }
    return amount.toLocaleString();
  };

  return (
    <div className="glass-panel rounded-[2rem] p-4 shadow-glass border border-white/60">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevMonth}
          className="h-10 w-10 rounded-xl hover:bg-white/60"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-xl font-black text-text-main">
          {year}년 {month}월
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="h-10 w-10 rounded-xl hover:bg-white/60"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day, idx) => (
          <div
            key={day}
            className={cn(
              "text-center text-sm font-bold py-2",
              idx === 0 ? "text-rose-400" : idx === 6 ? "text-blue-400" : "text-text-secondary"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="min-h-[72px]" />;
          }

          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayData = txByDate[dateStr];
          const isToday = dateStr === todayStr;
          const weekday = (idx % 7);

          return (
            <button
              key={dateStr}
              onClick={() => onDateClick(dateStr)}
              className={cn(
                "min-h-[72px] rounded-xl p-2 flex flex-col items-center justify-start transition-all hover:bg-white/60 relative",
                isToday && "ring-2 ring-primary ring-offset-1",
                dayData?.count && "bg-white/60"
              )}
            >
              <span
                className={cn(
                  "text-lg font-bold mb-1",
                  weekday === 0 ? "text-rose-400" : weekday === 6 ? "text-blue-400" : "text-text-main",
                  isToday && "text-primary"
                )}
              >
                {day}
              </span>

              {dayData && (
                <div className="flex flex-col items-center gap-0.5 w-full">
                  {dayData.income > 0 && (
                    <span className="text-[11px] font-bold text-blue-600 leading-tight">
                      +{formatAmount(dayData.income)}
                    </span>
                  )}
                  {dayData.expense > 0 && (
                    <span className="text-[11px] font-bold text-rose-600 leading-tight">
                      -{formatAmount(dayData.expense)}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
