import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { PocketFlowProvider } from "@/lib/pocketflow-store";

export const metadata: Metadata = {
  title: "PocketFlow",
  description: "Premium money clarity for real people."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body><PocketFlowProvider>{children}</PocketFlowProvider></body>
    </html>
  );
}
