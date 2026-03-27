import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: "gold" | "green" | "red" | "neutral";
};

export function Badge({ tone = "gold", className, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium",
        tone === "gold" &&
          "border-primary/25 bg-primary/10 text-primary",
        tone === "green" &&
          "border-success/25 bg-success/10 text-success",
        tone === "red" && "border-danger/25 bg-danger/10 text-danger",
        tone === "neutral" && "border-white/10 bg-white/5 text-muted",
        className
      )}
      {...props}
    />
  );
}
