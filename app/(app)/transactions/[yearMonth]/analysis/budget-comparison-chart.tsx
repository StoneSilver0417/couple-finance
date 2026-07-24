"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

interface BudgetComparisonItem {
  name: string;
  value: number;
  color: string;
}

interface BudgetComparisonChartProps {
  data: BudgetComparisonItem[];
}

function formatAmount(amount: number): string {
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}만`;
  }

  return amount.toLocaleString();
}

export default function BudgetComparisonChart({
  data,
}: BudgetComparisonChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value));

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
        >
          <XAxis type="number" hide domain={[0, maxValue * 1.2]} />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 13, fontWeight: 700, fill: "#374151" }}
            width={80}
          />
          <Bar
            dataKey="value"
            radius={[0, 12, 12, 0]}
            barSize={36}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              formatter={(value: unknown) => formatAmount(Number(value))}
              style={{ fontSize: 13, fontWeight: 700, fill: "#374151" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
