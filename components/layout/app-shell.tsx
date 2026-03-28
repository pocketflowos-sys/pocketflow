"use client";

import type { ReactNode, ComponentType } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CreditCard,
  HandCoins,
  Home,
  Landmark,
  Loader2,
  LogOut,
  Package,
  PiggyBank,
  Settings,
  ShieldCheck,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePocketFlow } from "@/lib/pocketflow-store";

const navigation: { href: Route; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/transactions", label: "Transactions", icon: CreditCard },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/lend-borrow", label: "Lend/Borrow", icon: HandCoins },
  { href: "/investments", label: "Investments", icon: Landmark },
  { href: "/assets", label: "Assets", icon: Package },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, syncing, signOut } = usePocketFlow();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-white/6 bg-white/[0.03] p-6 lg:block">
          <Link href="/" className="flex items-center gap-3 text-xl font-semibold">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-black">
              <Wallet className="h-5 w-5" />
            </div>
            PocketFlow
          </Link>

          <div className="mt-10 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                    active ? "bg-primary text-black" : "text-muted hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-10 rounded-[28px] border border-primary/15 bg-primary/10 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary">
              <ShieldCheck className="h-4 w-4" /> Paid access connected
            </p>
            <p className="mt-2 text-sm text-muted">
              Protected routes, real Supabase storage, and Razorpay webhook access control are wired in this build.
            </p>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col pb-28 lg:pb-0">
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/6 bg-background/85 px-4 py-4 backdrop-blur md:px-6">
            <div>
              <p className="text-sm text-muted">PocketFlow private workspace</p>
              <h1 className="text-xl font-semibold md:text-2xl">Track, review, and improve every rupee</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted md:block">
                {profile?.fullName || profile?.email || "PocketFlow user"}
              </div>
              <Button variant="secondary" onClick={handleSignOut} className="gap-2">
                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                Sign out
              </Button>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-7 gap-1 rounded-[24px] border border-white/10 bg-[#121826]/95 p-2 shadow-glow backdrop-blur lg:hidden">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl px-1 py-3 text-[10px] transition",
                active ? "bg-primary text-black" : "text-muted hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label.split("/")[0]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
