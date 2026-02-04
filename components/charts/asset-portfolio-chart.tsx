"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        {/* Center Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Total
          </span>
          <span className="text-xl font-black text-text-main">
            {total / 10000 >= 10000
              ? `${(total / 100000000).toFixed(1)}억`
              : `${(total / 10000).toFixed(0)}만`}
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
              label={({
                cx,
                cy,
                midAngle,
                innerRadius,
                outerRadius,
                percent,
              }: any) => {
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

                if (!percent || percent < 0.05) return null; // Don't show labels for very small slices

                return (
                  <text
                    x={x}
                    y={y}
                    fill="white"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-[10px] font-black"
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
                  className="stroke-2 stroke-white hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const percentage = ((data.value / total) * 100).toFixed(1);
                  return (
                    <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-white/50 ring-1 ring-black/5">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: data.color }}
                        />
                        <p className="font-bold text-sm text-text-main">
                          {data.name}
                        </p>
                      </div>
                      <p className="text-lg font-black text-text-main">
                        ₩{data.value.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {percentage}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Enhanced Legend */}
      <div className="mt-6 flex flex-col gap-3">
        {data.map((item, idx) => (
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
