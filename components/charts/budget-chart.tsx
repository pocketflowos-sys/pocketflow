"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { formatPercent } from "@/lib/formatters";

export function BudgetChart({ value }: { value: number }) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const chartValue = Math.max(0, Math.min(safeValue, 100));
  const data = [{ name: "budget", value: chartValue, fill: "#f6b626" }];

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
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-3xl font-semibold sm:text-5xl">{formatPercent(safeValue)}</p>
        <p className="mt-2 text-sm text-muted">budget used</p>
      </div>
    </div>
  );
}
