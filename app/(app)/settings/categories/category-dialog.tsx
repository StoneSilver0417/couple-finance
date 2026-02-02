"use client";

import { useState } from "react";
import { createCategory, updateCategory } from "@/lib/category-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CATEGORY_ICONS,
  CATEGORY_COLORS,
} from "@/lib/constants/category-options";
import { Loader2, Sparkles } from "lucide-react";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "income" | "expense";
  expenseCategory?: "fixed" | "variable" | "irregular";
  category?: any;
}

export function CategoryDialog({
  open,
  onOpenChange,
  type,
  expenseCategory,
  category,
}: CategoryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(category?.name || "");
  const [selectedIcon, setSelectedIcon] = useState(
    category?.icon || CATEGORY_ICONS[0],
  );
  const [selectedColor, setSelectedColor] = useState(
    category?.color || CATEGORY_COLORS[0].value,
  );

  const isEditing = !!category;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("type", type);
    if (expenseCategory) {
      formData.set("expense_category", expenseCategory);
    }
    formData.set("icon", selectedIcon);
    formData.set("color", selectedColor);

    const result = isEditing
      ? await updateCategory(category.id, formData)
      : await createCategory(formData);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success(
        isEditing
          ? "카테고리가 수정되었습니다 ✨"
          : "카테고리가 추가되었습니다 ✨",
      );
      onOpenChange(false);
      setName("");
      setSelectedIcon(CATEGORY_ICONS[0]);
      setSelectedColor(CATEGORY_COLORS[0].value);
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white shadow-2xl border-none p-0 overflow-hidden rounded-3xl">
        <div className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            {isEditing ? "카테고리 수정" : "새 카테고리 만들기"}
          </DialogTitle>
          <DialogDescription className="mt-1">
            {isEditing
              ? "카테고리 정보를 수정하세요"
              : "나만의 카테고리를 만들어보세요"}
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold">
              카테고리 이름
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 카페 & 디저트"
              required
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold">아이콘 선택</Label>
            <div className="grid grid-cols-5 gap-3 p-4 bg-muted/30 rounded-2xl max-h-[180px] overflow-y-auto hide-scrollbar">
              {CATEGORY_ICONS.map((icon, idx) => (
                <button
                  key={`${icon}-${idx}`}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`
                    h-12 w-12 rounded-xl text-2xl transition-all duration-150
                    hover:bg-white active:scale-90
                    ${
                      selectedIcon === icon
                        ? "bg-primary/20 ring-2 ring-primary shadow-sm scale-105"
                        : "bg-white/50"
                    }
                  `}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold">색상 선택</Label>
            <div className="grid grid-cols-4 gap-3">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`
                    h-16 rounded-2xl transition-all duration-200
                    hover:scale-105 hover:shadow-lg
                    ${
                      selectedColor === color.value
                        ? "ring-4 ring-primary ring-offset-2 scale-105 shadow-lg"
                        : "hover:ring-2 hover:ring-gray-300"
                    }
                  `}
                  style={{
                    background: `linear-gradient(135deg, ${color.light} 0%, ${color.value} 100%)`,
                  }}
                >
                  <span className="text-xs font-medium text-white drop-shadow-md">
                    {color.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-muted/30 rounded-2xl">
            <p className="text-sm text-muted-foreground mb-2">미리보기</p>
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"
                style={{ backgroundColor: selectedColor + "20" }}
              >
                {selectedIcon}
              </div>
              <div>
                <p className="font-semibold">{name || "카테고리 이름"}</p>
                <p className="text-xs text-muted-foreground">
                  {type === "income" ? "수입" : "지출"} •{" "}
                  {expenseCategory === "fixed"
                    ? "고정"
                    : expenseCategory === "variable"
                      ? "변동"
                      : "비정기"}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="h-11"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name}
              className="h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isEditing ? (
                "수정하기"
              ) : (
                "만들기"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
