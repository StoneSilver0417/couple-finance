"use client";

import { useMemo } from "react";
import {
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

// 축이 딱 떨어지는 값을 갖도록 하는 "nice number" 계산 (Heckbert 알고리즘)
function niceNum(range: number, round: boolean) {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / 10 ** exponent;
  let niceFraction: number;

  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }

  return niceFraction * 10 ** exponent;
}

function getNiceTicks(rawMin: number, rawMax: number, targetTickCount = 4) {
  let min = rawMin;
  let max = rawMax;
  // 전 구간 값이 동일(평평한 선)하면 값 크기에 비례해 여백을 둬야 눈금이 의미 있게 나뉨
  if (min === max) {
    const delta = Math.abs(min) * 0.1 || 10;
    min -= delta;
    max += delta;
  }

  const range = niceNum(max - min, false);
  const step = niceNum(range / (targetTickCount - 1), true);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;

  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step * 0.5; v += step) {
    ticks.push(Math.round(v) || 0); // -0 방지
  }

  return { min: niceMin, max: niceMax, ticks };
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
        <p className="text-sm font-medium text-text-secondary">
          기록이 없습니다
        </p>
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
            : `${(current.value / 10000).toFixed(0)}만`}
          원
        </p>
        <p className="text-[11px] text-text-secondary mt-3 text-center px-4">
          {current.label} 기록됨
          <br />
          자산을 수정하면 새 기록이 추가됩니다
        </p>
      </div>
    );
  }

  const minValue = Math.min(...chartData.map((d) => d.displayValue));
  const maxValue = Math.max(...chartData.map((d) => d.displayValue));
  const { min: niceMin, max: niceMax, ticks: niceTicks } = getNiceTicks(
    minValue,
    maxValue,
  );

  // 점이 많아도 X축 라벨은 최대 6개 정도만 남도록 간격을 계산
  const xAxisInterval = Math.max(0, Math.ceil(chartData.length / 6) - 1);

  return (
    <div className="relative trend-chart h-[200px] w-full">
      <style>{`
        .trend-chart svg,
        .trend-chart svg *,
        .trend-chart .recharts-wrapper,
        .trend-chart .recharts-surface,
        .trend-chart .recharts-area,
        .trend-chart .recharts-layer {
          outline: none !important;
          -webkit-tap-highlight-color: transparent !important;
          box-shadow: none !important;
        }
      `}</style>
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
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f0f0f0"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            dy={10}
            interval={xAxisInterval}
            minTickGap={20}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickFormatter={(value) => `${(value || 0).toLocaleString()}만`}
            domain={[niceMin, niceMax]}
            ticks={niceTicks}
            width={52}
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
            formatter={(value: number | string | undefined) => [
              `₩${(Number(value ?? 0) * 10000).toLocaleString()}`,
              "금액",
            ]}
          />
          <Area
            type="monotone"
            dataKey="displayValue"
            stroke="#fb6f92"
            strokeWidth={3}
            fill="url(#colorValue)"
            dot={false}
            activeDot={{ r: 6, fill: "#fb6f92" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
