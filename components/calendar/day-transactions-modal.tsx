"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteTransaction } from "@/lib/transaction-actions";
import { updateTransaction } from "@/lib/transaction-update-action";
import TransactionFormComponent from "@/app/(app)/transactions/transaction-form-component";
import { Transaction, Category } from "@/types";
import { useConfirm } from "@/components/ui/confirm-dialog";

interface DayTransactionsModalProps {
  open: boolean;
  onClose: () => void;
  date: string;
  transactions: Transaction[];
  categories: Category[];
  onAddNew: () => void;
}

export default function DayTransactionsModal({
  open,
  onClose,
  date,
  transactions,
  categories,
  onAddNew,
}: DayTransactionsModalProps) {
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const confirm = useConfirm();

  const dateObj = new Date(date + "T00:00:00");
  const formattedDate = dateObj.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const dayTransactions = transactions.filter(
    (tx) => tx.transaction_date === date
  );

  const totalIncome = dayTransactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = dayTransactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

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
    } else {
      toast.success("거래가 수정되었습니다.");
      setEditingTx(null);
    }
    setIsLoading(false);
  }

  if (editingTx) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="rounded-[2rem] max-h-[85vh] overflow-y-auto bg-white/98 border border-white/80 shadow-glass backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" /> 거래 수정
            </DialogTitle>
          </DialogHeader>
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
          <Button
            variant="ghost"
            onClick={() => setEditingTx(null)}
            className="mt-2"
          >
            취소
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-[2rem] max-h-[85vh] overflow-y-auto bg-white/98 border border-white/80 shadow-glass backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-text-main">
            {formattedDate}
          </DialogTitle>
        </DialogHeader>

        {/* Summary */}
        {dayTransactions.length > 0 && (
          <div className="flex gap-4 mb-4">
            {totalIncome > 0 && (
              <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold text-blue-400 mb-1">수입</p>
                <p className="text-sm font-black text-blue-600">
                  +₩{totalIncome.toLocaleString()}
                </p>
              </div>
            )}
            {totalExpense > 0 && (
              <div className="flex-1 bg-rose-50 rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold text-rose-400 mb-1">지출</p>
                <p className="text-sm font-black text-rose-600">
                  -₩{totalExpense.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Transactions List */}
        <div className="space-y-3 mb-4">
          {dayTransactions.length === 0 ? (
            <div className="text-center py-10 bg-gray-100 rounded-2xl">
              <p className="text-4xl mb-3">📅</p>
              <p className="font-bold text-gray-600">이 날은 거래가 없어요</p>
              <p className="text-sm text-gray-500 mt-1">아래 버튼으로 추가해보세요</p>
            </div>
          ) : (
            dayTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-xl"
                  style={{
                    backgroundColor: (tx.categories?.color || "#cbd5e1") + "20",
                  }}
                >
                  {tx.categories?.icon || "💰"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-text-main truncate">
                    {tx.categories?.name || "미분류"}
                  </p>
                  <p className="text-xs text-text-secondary truncate">
                    {tx.memo || (tx.type === "income" ? "수입" : "지출")}
                  </p>
                </div>
                <div
                  className={`font-black text-sm ${tx.type === "income" ? "text-blue-600" : "text-text-main"}`}
                >
                  {tx.type === "income" ? "+" : "-"}₩{tx.amount.toLocaleString()}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem
                      onClick={() => setEditingTx(tx)}
                      className="gap-2"
                    >
                      <Edit2 className="h-4 w-4" /> 수정
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(tx.id)}
                      className="gap-2 text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" /> 삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>

        {/* Add Button */}
        <Button
          onClick={onAddNew}
          className="w-full rounded-xl bg-gradient-to-r from-primary-dark to-primary text-white font-bold"
        >
          <Plus className="h-4 w-4 mr-2" /> 거래 추가
        </Button>
      </DialogContent>
    </Dialog>
  );
}
