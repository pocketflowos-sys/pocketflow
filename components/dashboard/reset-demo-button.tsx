"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePocketFlow } from "@/lib/pocketflow-store";

export function ResetDemoButton() {
  const { resetDemo } = usePocketFlow();

  return (
    <Button variant="secondary" onClick={resetDemo} className="gap-2">
      <RotateCcw className="h-4 w-4" />
      Reset demo data
    </Button>
  );
}
