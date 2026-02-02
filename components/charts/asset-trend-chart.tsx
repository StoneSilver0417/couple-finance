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

  if (data.length < 2) {
    return (
      <div className="h-[200px] flex items-center justify-center text-text-secondary text-sm">
        추세를 보려면 2개 이상의 데이터가 필요합니다
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
