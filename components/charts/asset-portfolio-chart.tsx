"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { PiggyBank } from "lucide-react";

interface AssetChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export default function AssetPortfolioChart({ data }: AssetChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const activeItem = activeIndex !== null ? data[activeIndex] : null;

  const formatAmount = (value: number) =>
    value / 10000 >= 10000
      ? `${(value / 100000000).toFixed(1)}억`
      : `${(value / 10000).toFixed(0)}만`;

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 opacity-60">
        <PiggyBank className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-muted-foreground text-sm">자산 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative h-[250px] w-full">
        {/* 클릭 시 말풍선 - 도넛 상단에 표시 */}
        {activeItem && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 animate-fade-in">
            <div
              className="relative px-4 py-2 rounded-2xl shadow-lg border border-white/60 backdrop-blur-md"
              style={{ backgroundColor: `${activeItem.color}15` }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: activeItem.color }}
                />
                <span className="text-xs font-bold text-text-main">
                  {activeItem.name}
                </span>
                <span className="text-xs font-black text-text-main">
                  {formatAmount(activeItem.value)}
                </span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${activeItem.color}20`,
                    color: activeItem.color,
                  }}
                >
                  {((activeItem.value / total) * 100).toFixed(1)}%
                </span>
              </div>
              {/* 말풍선 꼬리 */}
              <div
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-r border-b border-white/60"
                style={{ backgroundColor: `${activeItem.color}15` }}
              />
            </div>
          </div>
        )}

        {/* 도넛 중앙 - 항상 Total 표시 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Total
          </span>
          <span className="text-xl font-black text-text-main">
            {formatAmount(total)}
          </span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={4}
              cornerRadius={8}
              dataKey="value"
              stroke="none"
              isAnimationActive={true}
              labelLine={false}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={(_, index) =>
                setActiveIndex((prev) => (prev === index ? null : index))
              }
              label={({
                cx,
                cy,
                midAngle,
                innerRadius,
                outerRadius,
                percent,
                index,
              }: any) => {
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

                if (!percent || percent < 0.05) return null;

                return (
                  <text
                    x={x}
                    y={y}
                    fill="white"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-[10px] font-black"
                    style={{
                      opacity: activeIndex === null || activeIndex === index ? 1 : 0.4,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  style={{
                    opacity: activeIndex === null || activeIndex === index ? 1 : 0.4,
                    transition: "opacity 0.2s",
                    cursor: "pointer",
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Enhanced Legend */}
      <div className="mt-6 flex flex-col gap-3">
        {[...data].sort((a, b) => b.value - a.value).map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-2xl border shadow-sm hover:opacity-90 transition-all"
            style={{
              backgroundColor: item.color + "15",
              borderColor: item.color + "30"
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: item.color + "30" }}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: item.color }}>
                  {item.name}
                </p>
                <p className="text-sm font-black text-text-main">
                  {item.value >= 100000000
                    ? `${(item.value / 100000000).toFixed(1)}억`
                    : `${(item.value / 10000).toFixed(0)}만`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span
                className="text-xs font-bold px-2 py-1 rounded-full"
                style={{
                  backgroundColor: item.color + "20",
                  color: item.color
                }}
              >
                {((item.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
