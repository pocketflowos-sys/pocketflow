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
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{title}</p>
          <p className="mt-3 text-3xl font-semibold">{value}</p>
          <p
            className={`mt-2 text-sm ${
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
        {icon ? <div className="rounded-2xl bg-white/5 p-3 text-primary">{icon}</div> : null}
      </div>
    </Card>
  );
}
