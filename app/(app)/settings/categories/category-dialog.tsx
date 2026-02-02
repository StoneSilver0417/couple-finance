"use client";

import { useState, useEffect } from "react";
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
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(CATEGORY_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0].value);

  const isEditing = !!category;

  // category prop 변경 시 state 동기화
  useEffect(() => {
    if (category) {
      setName(category.name || "");
      setSelectedIcon(category.icon || CATEGORY_ICONS[0]);
      setSelectedColor(category.color || CATEGORY_COLORS[0].value);
    } else {
      setName("");
      setSelectedIcon(CATEGORY_ICONS[0]);
      setSelectedColor(CATEGORY_COLORS[0].value);
    }
  }, [category]);

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
      <DialogContent className="sm:max-w-[420px] max-h-[85vh] !bg-white shadow-2xl border-none p-0 overflow-hidden rounded-3xl backdrop-blur-none">
        <div className="px-5 pt-5">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-4 w-4 text-primary" />
            {isEditing ? "카테고리 수정" : "새 카테고리"}
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-xs">
            {isEditing
              ? "카테고리 정보를 수정하세요"
              : "나만의 카테고리를 만들어보세요"}
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 pt-3 space-y-4 overflow-y-auto max-h-[calc(85vh-80px)]">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold">
              카테고리 이름
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 카페 & 디저트"
              required
              className="h-10 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">아이콘 선택</Label>
            <div className="grid grid-cols-6 gap-2 p-3 bg-muted/30 rounded-xl max-h-[120px] overflow-y-auto hide-scrollbar">
              {CATEGORY_ICONS.map((icon, idx) => (
                <button
                  key={`${icon}-${idx}`}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`
                    h-10 w-10 rounded-lg text-xl transition-all duration-150
                    hover:bg-white active:scale-90
                    ${
                      selectedIcon === icon
                        ? "bg-primary/20 ring-2 ring-primary shadow-sm"
                        : "bg-white/50"
                    }
                  `}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">색상 선택</Label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`
                    h-12 rounded-xl transition-all duration-200
                    ${
                      selectedColor === color.value
                        ? "ring-2 ring-primary ring-offset-1 shadow-md"
                        : ""
                    }
                  `}
                  style={{
                    background: `linear-gradient(135deg, ${color.light} 0%, ${color.value} 100%)`,
                  }}
                >
                  <span className="text-[10px] font-medium text-white drop-shadow-md">
                    {color.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-muted/30 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1.5">미리보기</p>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center text-xl shadow-sm"
                style={{ backgroundColor: selectedColor + "20" }}
              >
                {selectedIcon}
              </div>
              <div>
                <p className="font-semibold text-sm">{name || "카테고리 이름"}</p>
                <p className="text-[10px] text-muted-foreground">
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

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="h-9 text-sm"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name}
              className="h-9 text-sm bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isEditing ? (
                "수정"
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
