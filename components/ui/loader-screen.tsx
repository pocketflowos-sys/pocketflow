import { Loader2, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";

export function LoaderScreen({
  title = "Loading PocketFlow",
  message = "Please wait while we prepare your workspace.",
  fullScreen = true,
  compact = false
}: {
  title?: string;
  message?: string;
  fullScreen?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={fullScreen ? "flex min-h-screen items-center justify-center px-4 py-10" : "flex items-center justify-center px-4 py-6"}>
      <Card className={compact ? "w-full max-w-md p-6 text-center" : "w-full max-w-lg p-8 text-center md:p-10"}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] border border-primary/25 bg-primary/12 text-primary shadow-glow">
          <Wallet className="h-7 w-7" />
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-primary">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-semibold uppercase tracking-[0.2em]">Please wait</span>
        </div>
        <h1 className="mt-4 text-2xl font-semibold md:text-3xl">{title}</h1>
        <p className="mt-3 text-sm text-muted md:text-base">{message}</p>
      </Card>
    </div>
  );
}

export function InlineLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-primary">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
