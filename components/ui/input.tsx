import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
};

export function Input({ label, icon, rightElement, className, ...props }: InputProps) {
  return (
    <label className="block">
      {label ? <span className="mb-2 block text-sm text-muted">{label}</span> : null}
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-primary/35">
        {icon ? <span className="shrink-0 text-muted">{icon}</span> : null}
        <input
          className={cn(
            "w-full min-w-0 bg-transparent text-foreground outline-none placeholder:text-muted/80",
            className
          )}
          {...props}
        />
        {rightElement ? <span className="shrink-0">{rightElement}</span> : null}
      </div>
    </label>
  );
}
