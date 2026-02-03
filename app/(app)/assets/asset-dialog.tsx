"use client";

import { useState, useEffect } from "react";
import { createAsset, updateAsset } from "@/lib/asset-actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AmountInput } from "@/components/ui/amount-input";
import { toast } from "sonner";
import {
  Loader2,
  PiggyBank,
  TrendingUp,
  Banknote,
  Baby,
  CreditCard,
} from "lucide-react";

interface Asset {
  id: string;
  name: string;
  type: string;
  current_amount: number;
  is_liability: boolean;
  owner_type?: string;
  owner_profile_id?: string | null;
  child_name?: string | null;
}

interface Member {
  id: string;
  full_name: string | null;
}

interface AssetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assetToEdit?: Asset | null;
  members?: Member[];
  currentUserId?: string;
}

const ASSET_TYPES = [
  { value: "savings", label: "저금 자산", icon: PiggyBank, color: "#10B981" },
  { value: "child", label: "자녀 자산", icon: Baby, color: "#F59E0B" },
  {
    value: "investment",
    label: "투자 자산",
    icon: TrendingUp,
    color: "#3B82F6",
  },
  { value: "cash", label: "현금", icon: Banknote, color: "#8B5CF6" },
  { value: "debt", label: "부채", icon: CreditCard, color: "#EF4444" },
];

const OWNER_TYPES = [
  { value: "JOINT", label: "공동" },
  { value: "INDIVIDUAL", label: "개인" },
  { value: "CHILD", label: "자녀" },
];

export default function AssetDialog({
  isOpen,
  onClose,
  assetToEdit,
  members = [],
  currentUserId = "",
}: AssetDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(
    assetToEdit?.type || "savings",
  );
  const [isLiability, setIsLiability] = useState(
    assetToEdit?.is_liability || false,
  );
  const [ownerType, setOwnerType] = useState(
    assetToEdit?.owner_type || "JOINT",
  );
  const [ownerProfileId, setOwnerProfileId] = useState(
    assetToEdit?.owner_profile_id || currentUserId,
  );
  const [childName, setChildName] = useState(
    assetToEdit?.child_name || "",
  );

  useEffect(() => {
    if (isOpen) {
      if (assetToEdit) {
        setSelectedType(assetToEdit.type);
        setIsLiability(assetToEdit.is_liability);
        setOwnerType(assetToEdit.owner_type || "JOINT");
        setOwnerProfileId(assetToEdit.owner_profile_id || currentUserId);
        setChildName(assetToEdit.child_name || "");
      } else {
        setSelectedType("savings");
        setIsLiability(false);
        setOwnerType("JOINT");
        setOwnerProfileId(currentUserId);
        setChildName("");
      }
    }
  }, [isOpen, assetToEdit, currentUserId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("type", selectedType);
    formData.set("is_liability", isLiability.toString());
    formData.set("owner_type", ownerType);
    if (ownerType === "INDIVIDUAL") {
      formData.set("owner_profile_id", ownerProfileId);
    }
    if (ownerType === "CHILD") {
      formData.set("child_name", childName);
    }

    const result = assetToEdit
      ? await updateAsset(assetToEdit.id, formData)
      : await createAsset(formData);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else {
      toast.success(
        assetToEdit ? "자산이 수정되었습니다." : "자산이 추가되었습니다.",
      );
      setIsLoading(false);
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl max-w-md bg-white border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle>
            {assetToEdit ? "자산 수정" : "새 자산 추가"}
          </DialogTitle>
          <DialogDescription>
            {assetToEdit
              ? "자산 정보를 수정합니다."
              : "보유하고 있는 자산을 등록하세요."}
          </DialogDescription>
        </DialogHeader>

        <form
          key={assetToEdit?.id || "new"}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label>자산 유형 *</Label>
            <div className="grid grid-cols-2 gap-3">
              {ASSET_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setSelectedType(type.value);
                      setIsLiability(type.value === "debt");
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 mx-auto mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <p
                      className={`text-sm font-bold ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {type.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">자산명 *</Label>
            <Input
              id="name"
              name="name"
              placeholder="예: 신한은행 적금"
              required
              defaultValue={assetToEdit?.name}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_amount">현재 금액 *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold z-10">
                ₩
              </span>
              <AmountInput
                id="current_amount"
                name="current_amount"
                placeholder="0"
                required
                defaultValue={assetToEdit?.current_amount}
                className="pl-7 rounded-xl font-bold text-lg"
              />
            </div>
          </div>

          {/* Owner Type Selection */}
          <div className="space-y-2">
            <Label>소유 구분</Label>
            <div className="flex gap-2">
              {OWNER_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setOwnerType(type.value)}
                  className={`flex-1 py-2 px-3 rounded-xl border-2 text-sm font-bold transition-all ${
                    ownerType === type.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Individual Owner Selection */}
          {ownerType === "INDIVIDUAL" && members.length > 0 && (
            <div className="space-y-2">
              <Label>소유자 선택</Label>
              <div className="flex gap-2">
                {members.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setOwnerProfileId(member.id)}
                    className={`flex-1 py-2 px-3 rounded-xl border-2 text-sm font-bold transition-all ${
                      ownerProfileId === member.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted hover:border-primary/50 text-muted-foreground"
                    }`}
                  >
                    {member.id === currentUserId ? "나" : member.full_name?.split(" ")[0] || "배우자"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Child Name Input */}
          {ownerType === "CHILD" && (
            <div className="space-y-2">
              <Label htmlFor="child_name">자녀 이름</Label>
              <Input
                id="child_name"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="예: 첫째, 둘째, 이름..."
                className="rounded-xl"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl h-11"
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl h-11"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : assetToEdit ? (
                "수정"
              ) : (
                "추가"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
