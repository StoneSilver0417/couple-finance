"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface TrendDataPoint {
  date: string;
  label: string;
  value: number;
}

interface AssetTrendChartProps {
  data: TrendDataPoint[];
}

export default function AssetTrendChart({ data }: AssetTrendChartProps) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      displayValue: d.value / 10000, // Convert to 만 단위
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="h-[200px] flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <span className="text-2xl">📈</span>
        </div>
        <p className="text-sm font-medium text-text-secondary">기록이 없습니다</p>
        <p className="text-xs text-text-secondary mt-1">
          자산을 추가하면 자동으로 기록됩니다
        </p>
      </div>
    );
  }

  // 데이터가 1개일 때 현재 상태만 표시
  if (data.length === 1) {
    const current = data[0];
    return (
      <div className="h-[200px] flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <span className="text-2xl">📊</span>
        </div>
        <p className="text-xs text-text-secondary mb-1">마지막 기록</p>
        <p className="text-2xl font-black text-text-main">
          {current.value >= 100000000
            ? `${(current.value / 100000000).toFixed(1)}억`
            : `${(current.value / 10000).toFixed(0)}만`}원
        </p>
        <p className="text-[11px] text-text-secondary mt-3 text-center px-4">
          {current.label} 기록됨<br />
          자산을 수정하면 새 기록이 추가됩니다
        </p>
      </div>
    );
  }

  const minValue = Math.min(...chartData.map((d) => d.displayValue));
  const maxValue = Math.max(...chartData.map((d) => d.displayValue));
  const padding = (maxValue - minValue) * 0.1 || 10;

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fb6f92" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#fb6f92" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickFormatter={(value) => `${value}만`}
            domain={[minValue - padding, maxValue + padding]}
            width={45}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "none",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              padding: "10px 14px",
            }}
            labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
            formatter={(value: number) => [
              `₩${(value * 10000).toLocaleString()}`,
              "금액",
            ]}
          />
          <Area
            type="monotone"
            dataKey="displayValue"
            stroke="#fb6f92"
            strokeWidth={3}
            fill="url(#colorValue)"
            dot={{ fill: "#fb6f92", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: "#fb6f92" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
