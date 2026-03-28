import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  compact = false
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={cn("mb-5 flex flex-col gap-3 md:mb-6 md:flex-row md:items-end md:justify-between", compact && "mb-4 gap-2") }>
      <div className="min-w-0">
        {eyebrow ? <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary/90 md:text-xs md:tracking-[0.18em]">{eyebrow}</p> : null}
        <h2 className={cn("mt-1 text-xl font-semibold md:text-3xl", compact && "text-lg md:text-2xl")}>{title}</h2>
        <p className={cn("mt-1 max-w-2xl text-sm text-muted md:mt-2 md:text-base", compact && "mt-1 text-xs md:text-sm")}>{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2 md:gap-3">{actions}</div> : null}
    </section>
  );
}
