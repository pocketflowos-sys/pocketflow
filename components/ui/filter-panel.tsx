"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function FilterPanel({
  title = "Filters",
  summary = [],
  hasActiveFilters = false,
  onClear,
  children,
  defaultOpen = false,
  mobileHint = "Tap to refine this page"
}: {
  title?: string;
  summary?: Array<string | false | null | undefined>;
  hasActiveFilters?: boolean;
  onClear?: () => void;
  children: ReactNode;
  defaultOpen?: boolean;
  mobileHint?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const summaryItems = useMemo(() => summary.filter(Boolean) as string[], [summary]);
  const summaryText = useMemo(() => {
    if (!summaryItems.length) return mobileHint;
    return summaryItems.join(" • ");
  }, [mobileHint, summaryItems]);

  return (
    <>
      {!open ? (
        <div className="mt-4 flex items-center justify-between gap-2 md:hidden">
          <p className="min-w-0 flex-1 truncate text-xs text-muted">{summaryText}</p>
          <div className="flex shrink-0 items-center gap-2">
            {hasActiveFilters && onClear ? (
              <Button variant="ghost" className="h-10 px-3 text-xs" onClick={onClear}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Clear
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(true)}
              className="h-11 rounded-2xl px-3.5"
              aria-label={`Show ${title.toLowerCase()}`}
            >
              <Filter className="mr-2 h-4 w-4 text-primary" />
              <span className="max-w-[7.5rem] truncate text-sm">{title}</span>
              {summaryItems.length ? (
                <span className="ml-2 rounded-full bg-primary/12 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {summaryItems.length}
                </span>
              ) : null}
            </Button>
          </div>
        </div>
      ) : null}

      {open ? (
        <Card className="mt-3 p-4 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-primary">
                  <Filter className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{summaryText}</p>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {hasActiveFilters && onClear ? (
                <Button variant="ghost" className="h-9 px-3 text-xs" onClick={onClear}>
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Clear
                </Button>
              ) : null}
              <button
                type="button"
                aria-label="Hide filters"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-muted transition hover:text-foreground"
              >
                <ChevronDown className="h-4 w-4 rotate-180" />
              </button>
            </div>
          </div>
          <div className="mt-4">{children}</div>
        </Card>
      ) : null}

      <Card className="mt-4 hidden p-6 md:block">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-primary">
                <Filter className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs text-muted">{summaryText}</p>
              </div>
            </div>
          </div>
          {hasActiveFilters && onClear ? (
            <Button variant="ghost" className="h-10 px-3 text-xs" onClick={onClear}>
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              Clear
            </Button>
          ) : null}
        </div>
        <div className="mt-4">{children}</div>
      </Card>
    </>
  );
}
