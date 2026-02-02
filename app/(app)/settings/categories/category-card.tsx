"use client";

import { useState } from "react";
import {
  deleteCategory,
  toggleCategoryVisibility,
} from "@/lib/category-actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Edit2, Trash2, Eye, EyeOff, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CategoryCardProps {
  category: any;
  onEdit: (category: any) => void;
}

export function CategoryCard({ category, onEdit }: CategoryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("정말 이 카테고리를 삭제하시겠습니까?")) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteCategory(category.id);

    if (result?.error) {
      toast.error(result.error);
      setIsDeleting(false);
    } else {
      toast.success("카테고리가 삭제되었습니다");
    }
  }

  async function handleToggleVisibility() {
    const result = await toggleCategoryVisibility(
      category.id,
      !category.is_hidden,
    );

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(
        category.is_hidden ? "카테고리가 표시됩니다" : "카테고리가 숨겨집니다",
      );
    }
  }

  return (
    <div
      onClick={() => onEdit(category)}
      className={`
        glass-panel group relative overflow-hidden transition-all duration-300
        hover:shadow-glow hover:scale-[1.02] cursor-pointer
        ${category.is_hidden ? "opacity-50" : ""}
        animate-slide-up rounded-[2.5rem] p-4 border border-white/60
      `}
    >
      <div
        className="absolute top-0 left-0 w-1.5 h-full opacity-80"
        style={{ backgroundColor: category.color }}
      />

      <div className="flex items-center gap-4 relative z-10">
        <div
          className="h-16 w-16 rounded-[2rem] flex items-center justify-center text-3xl shadow-candy border-2 border-white transition-transform group-hover:rotate-6"
          style={{
            background: `linear-gradient(135deg, ${category.color}20 0%, ${category.color}40 100%)`,
          }}
        >
          {category.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-black text-lg text-text-main tracking-tight truncate">
              {category.name}
            </h3>
            {category.is_custom && (
              <div className="h-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className={`h-4 px-2 rounded-full text-[9px] font-bold text-white flex items-center uppercase tracking-tighter`}
              style={{ backgroundColor: category.color }}
            >
              Category
            </div>
            {category.is_hidden && (
              <span className="text-[10px] font-bold text-text-secondary px-2 py-0.5 rounded-lg bg-gray-100 uppercase">
                Hidden
              </span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/40 hover:bg-white shadow-soft"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-5 w-5 text-text-secondary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="rounded-2xl p-2 min-w-[120px] bg-white shadow-lg border border-gray-100"
          >
            <DropdownMenuItem
              onClick={() => onEdit(category)}
              className="rounded-xl font-bold py-2.5"
            >
              <Edit2 className="h-4 w-4 mr-2 text-primary" />
              수정하기
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleToggleVisibility();
              }}
              className="rounded-xl font-bold py-2.5"
            >
              {category.is_hidden ? (
                <>
                  <Eye className="h-4 w-4 mr-2 text-green-500" />
                  표시하기
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 mr-2 text-orange-500" />
                  숨기기
                </>
              )}
            </DropdownMenuItem>
            {category.is_custom && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={isDeleting}
                className="rounded-xl font-bold py-2.5 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                삭제하기
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
