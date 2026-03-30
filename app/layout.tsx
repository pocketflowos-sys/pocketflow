import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { PocketFlowProvider } from "@/lib/pocketflow-store";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";

export const metadata: Metadata = {
  title: "PocketFlow",
  description: "Fast personal finance clarity for real people.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <PocketFlowProvider>
          <RegisterServiceWorker />
          {children}
        </PocketFlowProvider>
      </body>
    </html>
  );
}
