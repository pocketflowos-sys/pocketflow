"use client";

import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePocketFlow } from "@/lib/pocketflow-store";

export function ResetDemoButton() {
  const { refresh, syncing } = usePocketFlow();

  return (
    <Button variant="secondary" onClick={() => void refresh()} className="gap-2">
      <RefreshCcw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
      Refresh data
    </Button>
  );
}
