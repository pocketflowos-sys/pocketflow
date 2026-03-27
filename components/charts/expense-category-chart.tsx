"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";

const COLORS = ["#f6b626", "#14b8a6", "#ef4444", "#60a5fa", "#f97316"];

export function ExpenseCategoryChart({
  data
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "#0f172a",
              color: "#fff"
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
