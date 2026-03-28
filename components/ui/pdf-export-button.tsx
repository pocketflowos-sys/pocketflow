"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

function exportVisiblePageAsPdf() {
  const source =
    document.querySelector<HTMLElement>("[data-export-root]") ??
    document.querySelector<HTMLElement>("main");

  if (!source) {
    window.print();
    return;
  }

  const popup = window.open("", "_blank", "noopener,noreferrer,width=1200,height=900");
  if (!popup) {
    window.print();
    return;
  }

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join("\n");

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>PocketFlow Export</title>
    ${styles}
    <style>
      body { background:#fff !important; color:#111 !important; padding:24px; font-family:Inter,system-ui,sans-serif; }
      nav, aside, [data-export-hidden], .print-hide { display:none !important; }
      [data-export-root] { padding:0 !important; max-width:none !important; }
      .surface, .shadow-glow { box-shadow:none !important; }
      * { color-adjust:exact; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    </style>
  </head>
  <body>${source.outerHTML}</body>
</html>`;

  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  window.setTimeout(() => popup.print(), 250);
}

export function PdfExportButton({ label = "PDF" }: { label?: string }) {
  return (
    <Button variant="secondary" className="gap-2" onClick={exportVisiblePageAsPdf}>
      <FileText className="h-4 w-4" />
      {label}
    </Button>
  );
}
