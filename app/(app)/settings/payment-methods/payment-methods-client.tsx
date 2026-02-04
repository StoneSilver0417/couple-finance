"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  CreditCard,
  Banknote,
  Building2,
  MoreVertical,
  Trash2,
  Pencil,
  Star,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "@/lib/payment-method-actions";
import { toast } from "sonner";
import type { PaymentMethod, PaymentMethodType } from "@/types";

interface PaymentMethodsClientProps {
  paymentMethods: PaymentMethod[];
}

const TYPE_CONFIG: Record<
  PaymentMethodType,
  { label: string; icon: typeof CreditCard; color: string }
> = {
  CASH: { label: "현금", icon: Banknote, color: "text-green-500" },
  DEBIT_CARD: { label: "체크카드", icon: CreditCard, color: "text-blue-500" },
  CREDIT_CARD: { label: "신용카드", icon: CreditCard, color: "text-purple-500" },
  BANK_TRANSFER: { label: "계좌이체", icon: Building2, color: "text-gray-500" },
  OTHER: { label: "기타", icon: CreditCard, color: "text-gray-400" },
};

export default function PaymentMethodsClient({
  paymentMethods: initialMethods,
}: PaymentMethodsClientProps) {
  const [methods, setMethods] = useState(initialMethods);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();

  // mode=add 파라미터로 다이얼로그 자동 열기
  useEffect(() => {
    if (searchParams.get("mode") === "add") {
      setDialogOpen(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    try {
      let result;
      if (editingMethod) {
        result = await updatePaymentMethod(editingMethod.id, formData);
      } else {
        result = await createPaymentMethod(formData);
      }

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(editingMethod ? "수정되었습니다" : "추가되었습니다");
        setDialogOpen(false);
        setEditingMethod(null);
        // 페이지 새로고침으로 데이터 갱신
        window.location.reload();
      }
    } catch {
      toast.error("오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const result = await deletePaymentMethod(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("삭제되었습니다");
      setMethods(methods.filter((m) => m.id !== id));
    }
  };

  const openEditDialog = (method: PaymentMethod) => {
    setEditingMethod(method);
    setDialogOpen(true);
  };

  return (
    <div className="flex-1 w-full animate-fade-in pb-8">
      {/* Header */}
      <header className="flex items-center justify-between p-6 pt-10">
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button
              variant="ghost"
              size="icon"
              className="group rounded-full bg-white/60 hover:bg-white shadow-soft transition-all duration-300"
            >
              <ArrowLeft className="h-5 w-5 text-text-main group-hover:-translate-x-1 transition-transform" />
            </Button>
          </Link>
          <div>
            <p className="text-xs text-text-secondary font-bold tracking-wider uppercase mb-0.5">
              Settings
            </p>
            <h1 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-2">
              결제 수단 <CreditCard className="h-5 w-5 text-blue-500" />
            </h1>
          </div>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingMethod(null);
          }}
        >
          <DialogTrigger asChild>
            <Button
              size="icon"
              className="rounded-full h-12 w-12 bg-gradient-to-tr from-blue-600 to-blue-400 text-white shadow-lg"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2rem] border-none bg-white/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {editingMethod ? "결제 수단 수정" : "결제 수단 추가"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="예: 신한카드"
                  defaultValue={editingMethod?.name || ""}
                  required
                  className="rounded-xl h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">유형</Label>
                <Select
                  name="type"
                  defaultValue={editingMethod?.type || "CREDIT_CARD"}
                >
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="유형 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg">
                    {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key} className="bg-white hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <config.icon className={`h-4 w-4 ${config.color}`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">아이콘 (이모지)</Label>
                <Input
                  id="icon"
                  name="icon"
                  placeholder="💳"
                  defaultValue={editingMethod?.icon || "💳"}
                  className="rounded-xl h-12"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  name="is_default"
                  value="true"
                  defaultChecked={editingMethod?.is_default || false}
                  className="h-4 w-4 rounded"
                />
                <Label htmlFor="is_default" className="text-sm">
                  기본 결제 수단으로 설정
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 text-white font-bold"
              >
                {isSubmitting ? "처리 중..." : editingMethod ? "수정" : "추가"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="px-6 space-y-4">
        {methods.length === 0 ? (
          <div className="glass-panel p-8 rounded-[2rem] text-center border-dashed border-2 border-blue-200 bg-blue-50/30">
            <CreditCard className="h-12 w-12 text-blue-300 mx-auto mb-4" />
            <p className="text-text-secondary font-medium">
              등록된 결제 수단이 없습니다
            </p>
            <p className="text-sm text-text-secondary/70 mt-1">
              + 버튼을 눌러 추가하세요
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {methods.map((method, index) => {
              const config = TYPE_CONFIG[method.type as PaymentMethodType];
              const Icon = config?.icon || CreditCard;

              return (
                <motion.div
                  key={method.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-panel p-4 rounded-[1.5rem] flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-12 w-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm border border-white/60`}
                    >
                      {method.icon || <Icon className={`h-6 w-6 ${config?.color}`} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-text-main">{method.name}</p>
                        {method.is_default && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      <p className="text-xs text-text-secondary">
                        {config?.label || method.type}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem
                        onClick={() => openEditDialog(method)}
                        className="rounded-lg"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        수정
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(method.id)}
                        className="rounded-lg text-red-500 focus:text-red-500"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <div className="h-24" />
    </div>
  );
}
