import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function SummaryCard({
  title,
  value,
  detail,
  icon,
  tone = "neutral"
}: {
  title: string;
  value: string;
  detail: string;
  icon?: ReactNode;
  tone?: "neutral" | "green" | "red" | "gold";
}) {
  return (
    <Card className="p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs md:text-sm text-muted">{title}</p>
          <p className="mt-2 text-2xl font-semibold md:mt-3 md:text-3xl">{value}</p>
          <p
            className={`mt-1.5 text-xs md:mt-2 md:text-sm ${
              tone === "green"
                ? "text-success"
                : tone === "red"
                  ? "text-danger"
                  : tone === "gold"
                    ? "text-primary"
                    : "text-muted"
            }`}
          >
            {detail}
          </p>
        </div>
        {icon ? <div className="rounded-2xl bg-white/5 p-2.5 text-primary md:p-3">{icon}</div> : null}
      </div>
    </Card>
  );
}
