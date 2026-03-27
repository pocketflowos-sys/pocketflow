"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export function InvestmentChart({
  data
}: {
  data: { month: string; value: number }[];
}) {
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="investmentFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#f6b626" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#f6b626" stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey="value"
            stroke="#f6b626"
            fill="url(#investmentFill)"
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
