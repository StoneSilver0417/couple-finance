"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MonthlyCalendar from "@/components/calendar/monthly-calendar";
import DayTransactionsModal from "@/components/calendar/day-transactions-modal";
import { Transaction, Category } from "@/types";

interface CalendarViewClientProps {
  year: number;
  month: number;
  transactions: Transaction[];
  categories: Category[];
}

export default function CalendarViewClient({
  year,
  month,
  transactions,
  categories,
}: CalendarViewClientProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
  };

  const handleMonthChange = (newYear: number, newMonth: number) => {
    const yearMonth = `${newYear}-${String(newMonth).padStart(2, "0")}`;
    router.push(`/transactions/${yearMonth}`);
  };

  const handleAddNew = () => {
    if (selectedDate) {
      router.push(`/transactions/new?date=${selectedDate}`);
    } else {
      router.push("/transactions/new");
    }
  };

  return (
    <>
      <MonthlyCalendar
        year={year}
        month={month}
        transactions={transactions}
        onDateClick={handleDateClick}
        onMonthChange={handleMonthChange}
      />

      {selectedDate && (
        <DayTransactionsModal
          open={!!selectedDate}
          onClose={() => setSelectedDate(null)}
          date={selectedDate}
          transactions={transactions}
          categories={categories}
          onAddNew={handleAddNew}
        />
      )}
    </>
  );
}
