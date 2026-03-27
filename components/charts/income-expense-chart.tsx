"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export function IncomeExpenseChart({
  data
}: {
  data: { month: string; income: number; expense: number }[];
}) {
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={12}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="month" tick={{ fill: "#9aa4ba", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#9aa4ba", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "#0f172a",
              color: "#fff"
            }}
          />
          <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
          <Bar dataKey="expense" fill="#f6b626" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
