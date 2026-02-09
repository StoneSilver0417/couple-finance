"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const activeIndex = hoveredIndex ?? selectedIndex;
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
      {/* 포커스/클릭 시 검은 테두리 제거 */}
      <style>{`
        .portfolio-chart svg,
        .portfolio-chart svg *,
        .portfolio-chart .recharts-surface,
        .portfolio-chart .recharts-sector,
        .portfolio-chart .recharts-pie,
        .portfolio-chart .recharts-layer {
          outline: none !important;
          -webkit-tap-highlight-color: transparent !important;
          box-shadow: none !important;
        }
        .portfolio-chart .recharts-sector:focus,
        .portfolio-chart .recharts-sector:active {
          outline: none !important;
        }
      `}</style>

      <div className="relative h-[250px] w-full portfolio-chart">
        {/* 도넛 중앙 텍스트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Total
          </span>
          <span className="text-xl font-black text-text-main">
            {formatAmount(total)}
          </span>
          {/* 클릭 시 선택 정보를 Total 아래에 간단히 표시 */}
          {activeItem && (
            <div className="flex items-center gap-1.5 mt-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: activeItem.color }}
              />
              <span className="text-[11px] font-bold text-text-main">
                {activeItem.name}
              </span>
              <span
                className="text-[11px] font-black"
                style={{ color: activeItem.color }}
              >
                {formatAmount(activeItem.value)}
              </span>
            </div>
          )}
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
              isAnimationActive={false}
              labelLine={false}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={(_, index) => {
                setSelectedIndex((prev) => (prev === index ? null : index));
              }}
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
                      opacity:
                        activeIndex === null || activeIndex === index ? 1 : 0.4,
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
                    opacity:
                      activeIndex === null || activeIndex === index ? 1 : 0.4,
                    cursor: "pointer",
                  }}
                  tabIndex={-1}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-col gap-3">
        {[...data]
          .sort((a, b) => b.value - a.value)
          .map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-2xl border shadow-sm hover:opacity-90 transition-all"
              style={{
                backgroundColor: item.color + "15",
                borderColor: item.color + "30",
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
                  <p
                    className="text-xs font-bold"
                    style={{ color: item.color }}
                  >
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
                    color: item.color,
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
