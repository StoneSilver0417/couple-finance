"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAsset } from "@/lib/asset-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  PiggyBank,
  Baby,
  TrendingUp,
  Banknote,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

const ASSET_TYPES = [
  {
    value: "savings",
    label: "저금 자산",
    icon: PiggyBank,
    color: "#10B981",
    description: "은행 계좌, 적금, 예금",
  },
  {
    value: "child",
    label: "자녀 자산",
    icon: Baby,
    color: "#F59E0B",
    description: "자녀 명의 계좌, 교육 적금",
  },
  {
    value: "investment",
    label: "투자 자산",
    icon: TrendingUp,
    color: "#3B82F6",
    description: "주식, 펀드, 기타 투자",
  },
  {
    value: "cash",
    label: "현금",
    icon: Banknote,
    color: "#8B5CF6",
    description: "보유 현금, 기타 자산",
  },
  {
    value: "debt",
    label: "부채",
    icon: CreditCard,
    color: "#EF4444",
    description: "대출, 카드빚 등",
  },
];

export default function NewAssetPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState("savings");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("type", selectedType);
    formData.set("is_liability", (selectedType === "debt").toString());

    const result = await createAsset(formData);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success("자산이 추가되었습니다! ✨");
      router.push("/assets");
    }
  }

  const selectedTypeConfig =
    ASSET_TYPES.find((t) => t.value === selectedType) || ASSET_TYPES[0];

  return (
    <div className="flex-1 w-full animate-fade-in pb-8">
      {/* Stitch Header */}
      <header className="flex items-center gap-4 p-6 pt-10">
        <Link href="/assets">
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
            New Asset
          </p>
          <h1 className="text-2xl font-black text-text-main tracking-tight">
            자산 추가
          </h1>
        </div>
      </header>

      <div className="px-6">
        <div className="glass-panel p-6 rounded-[2.5rem] shadow-glass border border-white/60">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-text-main font-bold pl-1">
                자산 유형 *
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {ASSET_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedType === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setSelectedType(type.value)}
                      className={`p-4 rounded-[1.5rem] border transition-all text-left relative overflow-hidden group ${
                        isSelected
                          ? "border-transparent bg-primary text-white shadow-lg shadow-primary/30 scale-105"
                          : "border-white/60 bg-white/40 hover:bg-white/60 hover:scale-102 text-text-secondary"
                      }`}
                    >
                      <div className="relative z-10 flex flex-col items-center text-center gap-2">
                        <Icon
                          className={`h-6 w-6 ${isSelected ? "text-white" : "text-text-secondary"}`}
                        />
                        <p
                          className={`text-sm font-bold ${isSelected ? "text-white" : "text-text-main"}`}
                        >
                          {type.label}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-text-main font-bold pl-1">
                자산명 *
              </Label>
              <Input
                id="name"
                name="name"
                placeholder={
                  selectedType === "debt"
                    ? "예: 주택담보대출"
                    : selectedType === "savings"
                      ? "예: 신한은행 적금"
                      : selectedType === "investment"
                        ? "예: 삼성전자 주식"
                        : "예: 자산 이름"
                }
                required
                className="rounded-2xl border-white/60 bg-white/50 focus:bg-white/80 transition-all h-12"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="current_amount"
                className="text-text-main font-bold pl-1"
              >
                현재 금액 *
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold">
                  ₩
                </span>
                <Input
                  id="current_amount"
                  name="current_amount"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  required
                  className="pl-8 rounded-2xl border-white/60 bg-white/50 focus:bg-white/80 transition-all font-bold text-lg h-12"
                />
              </div>
              <p className="text-xs text-text-secondary pl-1">
                {selectedType === "debt"
                  ? "부채 금액을 입력하세요"
                  : "현재 보유 금액을 입력하세요"}
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Link href="/assets" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-2xl h-12 border-none bg-white/40 hover:bg-white/60 text-text-secondary font-bold"
                  disabled={isLoading}
                >
                  취소
                </Button>
              </Link>
              <Button
                type="submit"
                className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20 bg-gradient-to-tr from-primary-dark to-primary text-white hover:scale-[1.05] active:scale-95 transition-all border-none"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "추가하기"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom Spacer */}
      <div className="h-24" />
    </div>
  );
}
