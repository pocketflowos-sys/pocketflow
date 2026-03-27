import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80",
        variant === "primary" &&
          "bg-primary text-black shadow-soft hover:-translate-y-0.5 hover:opacity-95",
        variant === "secondary" &&
          "border border-white/10 bg-white/5 text-white hover:border-primary/30 hover:bg-white/10",
        variant === "ghost" && "text-muted hover:text-white",
        className
      )}
      {...props}
    />
  );
}
