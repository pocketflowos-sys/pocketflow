"use client";

import {
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  PolarAngleAxis
} from "recharts";

export function BudgetChart({ value }: { value: number }) {
  const data = [{ name: "budget", value, fill: "#f6b626" }];

  return (
    <div className="relative h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="60%"
          outerRadius="95%"
          barSize={18}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar cornerRadius={18} dataKey="value" />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-5xl font-semibold">{value}%</p>
        <p className="mt-2 text-sm text-muted">budget used</p>
      </div>
    </div>
  );
}
