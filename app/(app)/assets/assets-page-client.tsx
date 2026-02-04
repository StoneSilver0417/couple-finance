"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, LineChart } from "lucide-react";
import AssetsListClient from "./assets-list-client";
import AssetPortfolioChart from "@/components/charts/asset-portfolio-chart";
import AssetTrendChart from "@/components/charts/asset-trend-chart";
import AssetFilterTabs from "@/components/assets/asset-filter-tabs";
import { Asset, AssetHistory } from "@/types";

interface Member {
  id: string;
  full_name: string | null;
}

interface AssetsPageClientProps {
  assets: Asset[];
  members: Member[];
  currentUserId: string;
  assetHistory: AssetHistory[];
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
  assetHistory,
}: AssetsPageClientProps) {
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>(assets);
  const [activeFilterId, setActiveFilterId] = useState("ALL");

  // 필터 변경 핸들러
  const handleFilterChange = (filtered: Asset[], filterId?: string) => {
    setFilteredAssets(filtered);
    if (filterId) setActiveFilterId(filterId);
  };

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

  // 자산 추이 차트 데이터 (필터별)
  const trendData = useMemo(() => {
    return assetHistory.map((h) => {
      let value = h.total_net_worth;

      // 필터가 ALL이 아닌 경우 breakdown_data에서 해당 값 사용
      if (activeFilterId !== "ALL" && h.breakdown_data) {
        const breakdown = h.breakdown_data as Record<string, number>;
        value = breakdown[activeFilterId] ?? 0;
      }

      // 날짜 포맷 (MM/DD)
      const date = new Date(h.record_date);
      const label = `${date.getMonth() + 1}/${date.getDate()}`;

      return {
        date: h.record_date,
        label,
        value: Number(value),
      };
    });
  }, [assetHistory, activeFilterId]);

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
          onFilterChange={handleFilterChange}
        />

        {/* Net Worth Card */}
        <div className="glass-panel w-full rounded-[2.5rem] p-6 shadow-glass relative overflow-hidden bg-gradient-to-br from-indigo-50/50 to-white/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl opacity-50"></div>

          <div className="flex flex-col items-center text-center relative z-10">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">
              총 순자산
            </span>
            <h2
              className={`text-3xl font-black tracking-tight mb-6 ${netWorth >= 0 ? "text-text-main" : "text-destructive"}`}
            >
              {netWorth >= 0 ? "" : "-"}
              {Math.abs(netWorth) >= 100000000
                ? `${(Math.abs(netWorth) / 100000000).toFixed(1)}억`
                : `${(Math.abs(netWorth) / 10000).toFixed(0)}만`}
              <span className="text-lg font-bold text-text-secondary ml-1">원</span>
            </h2>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-white/60 rounded-2xl p-3 border border-white/50 shadow-sm flex flex-col items-center">
                <span className="text-[10px] font-bold text-green-600 mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> 자산 합계
                </span>
                <span className="text-lg font-black text-emerald-600">
                  {totalAssets >= 100000000
                    ? `${(totalAssets / 100000000).toFixed(1)}억`
                    : `${(totalAssets / 10000).toFixed(0)}만`}
                </span>
              </div>
              <div className="bg-white/60 rounded-2xl p-3 border border-white/50 shadow-sm flex flex-col items-center">
                <span className="text-[10px] font-bold text-red-500 mb-1 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" /> 부채 합계
                </span>
                <span className="text-lg font-black text-rose-600">
                  {totalLiabilities >= 100000000
                    ? `${(totalLiabilities / 100000000).toFixed(1)}억`
                    : `${(totalLiabilities / 10000).toFixed(0)}만`}
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

        {/* Asset Trend Chart - 자산 추이 */}
        <AnimatePresence mode="wait">
          {trendData.length > 0 && (
            <motion.div
              key={`trend-${activeFilterId}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="glass-panel p-5 rounded-[2rem] border border-white/60"
            >
              <div className="px-2 mb-4">
                <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-primary" />
                  자산 변동 기록
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  자산을 추가/수정할 때마다 자동 기록됩니다
                </p>
              </div>
              <AssetTrendChart data={trendData} />
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
