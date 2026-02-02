"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import AssetsListClient from "./assets-list-client";
import AssetPortfolioChart from "@/components/charts/asset-portfolio-chart";
import AssetFilterTabs from "@/components/assets/asset-filter-tabs";
import { Asset } from "@/types";

interface Member {
  id: string;
  full_name: string | null;
}

interface AssetsPageClientProps {
  assets: Asset[];
  members: Member[];
  currentUserId: string;
}

// PRD 표준: 대문자 자산 타입
const ASSET_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  CASH: { label: "현금", color: "#8B5CF6" },
  SAVINGS: { label: "저금 자산", color: "#10B981" },
  INVESTMENT: { label: "투자 자산", color: "#3B82F6" },
  REAL_ESTATE: { label: "부동산", color: "#F97316" },
  DEBT: { label: "부채", color: "#EF4444" },
  CHILD_SAVINGS: { label: "자녀 자산", color: "#F59E0B" },
  OTHER: { label: "기타", color: "#6B7280" },
  // 하위 호환성 (기존 소문자 데이터)
  savings: { label: "저금 자산", color: "#10B981" },
  child: { label: "자녀 자산", color: "#F59E0B" },
  investment: { label: "투자 자산", color: "#3B82F6" },
  cash: { label: "현금", color: "#8B5CF6" },
  debt: { label: "부채", color: "#EF4444" },
};

export default function AssetsPageClient({
  assets,
  members,
  currentUserId,
}: AssetsPageClientProps) {
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>(assets);

  // Calculate totals for filtered assets
  const totalAssets = useMemo(
    () =>
      filteredAssets
        .filter((a) => !a.is_liability)
        .reduce((sum, a) => sum + Number(a.current_amount), 0),
    [filteredAssets],
  );

  const totalLiabilities = useMemo(
    () =>
      filteredAssets
        .filter((a) => a.is_liability)
        .reduce((sum, a) => sum + Number(a.current_amount), 0),
    [filteredAssets],
  );

  const netWorth = totalAssets - totalLiabilities;

  // Prepare chart data for filtered assets
  const chartData = useMemo(() => {
    return Object.entries(
      filteredAssets
        .filter((a) => !a.is_liability)
        .reduce(
          (acc, asset) => {
            const type = asset.type;
            if (!acc[type]) acc[type] = 0;
            acc[type] += Number(asset.current_amount);
            return acc;
          },
          {} as Record<string, number>,
        ),
    ).map(([type, value]) => ({
      name: ASSET_TYPE_CONFIG[type]?.label || type,
      value: value as number,
      color: ASSET_TYPE_CONFIG[type]?.color || "#cbd5e1",
    }));
  }, [filteredAssets]);

  return (
    <div className="flex-1 w-full animate-fade-in pb-8">
      {/* Header */}
      <header className="flex items-center justify-between p-6 pt-10">
        <div className="flex items-center gap-4">
          <Link href="/">
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
              나의 자산
            </p>
            <h1 className="text-2xl font-black text-text-main tracking-tight flex items-center gap-2">
              자산 관리 <Wallet className="h-5 w-5 text-emerald-500" />
            </h1>
          </div>
        </div>
      </header>

      <div className="px-6 space-y-6">
        {/* Filter Tabs */}
        <AssetFilterTabs
          assets={assets}
          members={members}
          currentUserId={currentUserId}
          onFilterChange={setFilteredAssets}
        />

        {/* Net Worth Card */}
        <div className="glass-panel w-full rounded-[2.5rem] p-6 shadow-glass relative overflow-hidden bg-gradient-to-br from-indigo-50/50 to-white/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl opacity-50"></div>

          <div className="flex flex-col items-center text-center relative z-10">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">
              총 순자산
            </span>
            <h2
              className={`text-4xl font-black tracking-tight mb-6 ${netWorth >= 0 ? "text-text-main" : "text-destructive"}`}
            >
              ₩{netWorth.toLocaleString()}
            </h2>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-white/60 rounded-2xl p-3 border border-white/50 shadow-sm flex flex-col items-center">
                <span className="text-[10px] font-bold text-green-600 mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> 자산 합계
                </span>
                <span className="text-lg font-bold text-text-main">
                  ₩{totalAssets.toLocaleString()}
                </span>
              </div>
              <div className="bg-white/60 rounded-2xl p-3 border border-white/50 shadow-sm flex flex-col items-center">
                <span className="text-[10px] font-bold text-red-500 mb-1 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" /> 부채 합계
                </span>
                <span className="text-lg font-bold text-text-main">
                  ₩{totalLiabilities.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Chart Section - 애니메이션 적용 */}
        <AnimatePresence mode="wait">
          {chartData.length > 0 && (
            <motion.div
              key={`chart-${filteredAssets.map(a => a.id).join('-')}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="glass-panel p-5 rounded-[2rem] border border-white/60"
            >
              <h3 className="text-lg font-bold text-text-main mb-4 px-2">
                포트폴리오
              </h3>
              <AssetPortfolioChart data={chartData} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Asset List Section - 애니메이션 적용 */}
        <div>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-lg font-bold text-text-main">자산 목록</h3>
          </div>

          <AnimatePresence mode="wait">
            {filteredAssets.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="glass-panel p-8 rounded-[2rem] text-center border-dashed border-2 border-primary/20 bg-primary/5 flex flex-col items-center gap-3"
              >
                <div className="h-12 w-12 rounded-full bg-white/50 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-text-secondary" />
                </div>
                <p className="text-sm text-text-secondary font-medium">
                  해당 필터에 자산이 없습니다
                </p>
                <Link href="/assets/new">
                  <Button size="sm" className="rounded-xl mt-2 font-bold">
                    자산 등록
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key={`list-${filteredAssets.map(a => a.id).join('-')}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-white/40 rounded-[2rem] p-1 border border-white/40"
              >
                <AssetsListClient
                  assets={filteredAssets as any}
                  members={members}
                  currentUserId={currentUserId}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Spacer */}
      <div className="h-24" />
    </div>
  );
}
