"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Repeat } from "lucide-react";
import type { Category } from "@/types";
import type { RecurringRuleWithCategory } from "./recurring-client";
import { RecurringRuleForm } from "./recurring-rule-form";

interface RecurringRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: RecurringRuleWithCategory | null;
  categories: Category[];
}

export function RecurringRuleDialog({
  open,
  onOpenChange,
  rule,
  categories,
}: RecurringRuleDialogProps) {
  const isEditing = !!rule;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] min-h-0 flex-col overflow-hidden rounded-3xl border border-white/60 !bg-white/95 p-0 shadow-glass backdrop-blur-md sm:max-w-[420px]">
        <div className="shrink-0 px-5 pt-5">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Repeat className="h-4 w-4 text-primary" aria-hidden="true" />
            {isEditing ? "반복 거래 수정" : "새 반복 거래"}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm">
            {isEditing
              ? "반복 거래 정보를 수정하세요"
              : "매월 자동으로 추가될 거래를 설정하세요"}
          </DialogDescription>
        </div>

        <RecurringRuleForm
          key={rule?.id ?? "new"}
          rule={rule}
          categories={categories}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}
