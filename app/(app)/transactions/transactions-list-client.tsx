"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteTransaction } from "@/lib/transaction-actions";
import { updateTransaction } from "@/lib/transaction-update-action";
import TransactionFormComponent, {
  TransactionFormData,
} from "./transaction-form-component";
import { useConfirm } from "@/components/ui/confirm-dialog";

import { Transaction, Category } from "@/types";

interface TransactionsListClientProps {
  transactions: Transaction[];
  categories: Category[];
  groupByDate?: boolean;
}

export default function TransactionsListClient({
  transactions,
  categories,
  groupByDate = false,
}: TransactionsListClientProps) {
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const confirm = useConfirm();

  async function handleDelete(id: string) {
    const confirmed = await confirm({
      title: "거래 삭제",
      message: "정말 이 거래를 삭제하시겠습니까?",
      confirmText: "삭제",
      variant: "danger",
    });
    if (!confirmed) return;

    const result = await deleteTransaction(id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("거래가 삭제되었습니다.");
    }
  }

  async function handleUpdate(formData: FormData) {
    if (!editingTx) return;
    setIsLoading(true);
    const result = await updateTransaction(editingTx.id, formData);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success("거래가 수정되었습니다.");
      setIsLoading(false);
      setEditingTx(null);
    }
  }

  const renderCard = (tx: Transaction) => (
    <div className="bg-white/40 border border-white/60 p-4 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none"></div>

      <div className="flex items-center gap-4 relative z-10">
        <div
          className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner bg-white/50"
          style={{
            backgroundColor: (tx.categories?.color || "#cbd5e1") + "20",
          }}
        >
          <span className="filter drop-shadow-sm group-hover:scale-110 transition-transform">
            {tx.categories?.icon || "💰"}
          </span>
        </div>

        <div className="flex-1 min-w-0" onClick={() => setEditingTx(tx)}>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-base text-text-main truncate">
              {tx.categories?.name || "미분류"}
            </span>
            {tx.expense_type && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/60 border border-white/40 text-text-secondary font-bold uppercase tracking-wide">
                {tx.expense_type === "fixed"
                  ? "고정"
                  : tx.expense_type === "variable"
                    ? "변동"
                    : "비정기"}
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary truncate font-medium">
            {tx.memo || (tx.type === "income" ? "수입" : "지출")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`text-lg font-black tracking-tight ${tx.type === "income" ? "text-indigo-600" : "text-text-main"}`}
          >
            {tx.type === "income" ? "+" : ""}₩{tx.amount.toLocaleString()}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-black/5"
              >
                <MoreVertical className="h-4 w-4 text-text-secondary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-2xl border-white/60 bg-white shadow-xl p-1"
            >
              <DropdownMenuItem
                onClick={() => setEditingTx(tx)}
                className="gap-2 rounded-xl focus:bg-black/5 font-medium cursor-pointer"
              >
                <Edit2 className="h-4 w-4" /> 수정
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(tx.id)}
                className="gap-2 rounded-xl text-rose-500 focus:text-rose-600 focus:bg-rose-50 font-medium cursor-pointer"
              >
                <Trash2 className="h-4 w-4" /> 삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );

  const groupedTransactions: Record<string, Transaction[]> = {};
  if (groupByDate) {
    transactions.forEach((tx) => {
      const dateStr = tx.transaction_date;
      if (!groupedTransactions[dateStr]) groupedTransactions[dateStr] = [];
      groupedTransactions[dateStr].push(tx);
    });
  }

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) =>
    b.localeCompare(a),
  );

  return (
    <>
      <div className="space-y-6">
        {groupByDate ? (
          sortedDates.map((dateStr) => {
            const dateTxs = groupedTransactions[dateStr];
            const dayTotal = dateTxs.reduce(
              (sum, tx) =>
                sum + (tx.type === "expense" ? -tx.amount : tx.amount),
              0,
            );
            const d = new Date(dateStr);
            const formattedDate = d.toLocaleDateString("ko-KR", {
              month: "short",
              day: "numeric",
              weekday: "short",
            });

            return (
              <div key={dateStr} className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-bold text-text-secondary tracking-wider uppercase bg-white/40 px-2 py-1 rounded-lg backdrop-blur-sm border border-white/30">
                    {formattedDate}
                  </span>
                  <span
                    className={`text-xs font-black ${dayTotal >= 0 ? "text-indigo-500" : "text-text-secondary"}`}
                  >
                    {dayTotal > 0 ? "+" : ""}
                    {dayTotal.toLocaleString()}
                  </span>
                </div>
                <div className="space-y-3">
                  {dateTxs.map((tx) => (
                    <div key={tx.id}>{renderCard(tx)}</div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id}>{renderCard(tx)}</div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={!!editingTx}
        onOpenChange={(open) => !open && setEditingTx(null)}
      >
        <DialogContent className="rounded-[2.5rem] max-h-[85vh] overflow-y-auto bg-white border border-white/20 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-text-main flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-indigo-500" /> 거래 수정
            </DialogTitle>
            <DialogDescription className="text-text-secondary">
              거래 내역을 수정합니다.
            </DialogDescription>
          </DialogHeader>

          {editingTx && (
            <TransactionFormComponent
              categories={categories}
              initialData={{
                type: editingTx.type,
                expense_type: editingTx.expense_type,
                amount: editingTx.amount,
                category_id: editingTx.category_id,
                transaction_date: editingTx.transaction_date,
                memo: editingTx.memo,
              }}
              onSubmit={handleUpdate}
              isLoading={isLoading}
              submitLabel="수정 완료"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
