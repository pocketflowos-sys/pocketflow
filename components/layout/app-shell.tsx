"use client";

import { useEffect, useState, type ReactNode, type ComponentType } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CreditCard,
  FileText,
  HandCoins,
  Home,
  Landmark,
  Loader2,
  LogOut,
  Menu,
  Package,
  PiggyBank,
  Settings,
  ShieldCheck,
  Wallet,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePocketFlow } from "@/lib/pocketflow-store";

const navigation: { href: Route; label: string; shortLabel: string; icon: ComponentType<{ className?: string }> }[] = [
  { href: "/dashboard", label: "Home", shortLabel: "Home", icon: Home },
  { href: "/transactions", label: "Transactions", shortLabel: "Txn", icon: CreditCard },
  { href: "/budgets", label: "Budgets", shortLabel: "Budget", icon: PiggyBank },
  { href: "/lend-borrow", label: "Lend/Borrow", shortLabel: "Lend", icon: HandCoins },
  { href: "/investments", label: "Investments", shortLabel: "Invest", icon: Landmark },
  { href: "/assets", label: "Assets", shortLabel: "Assets", icon: Package },
  { href: "/settings", label: "Settings", shortLabel: "Settings", icon: Settings }
];

const mobileNavigation = navigation.filter((item) => ["/dashboard", "/transactions", "/budgets", "/lend-borrow", "/investments"].includes(item.href));

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Overview", subtitle: "PocketFlow workspace" },
  "/transactions": { title: "Transactions", subtitle: "Money movement" },
  "/budgets": { title: "Budgets", subtitle: "Monthly plan" },
  "/lend-borrow": { title: "Lend / Borrow", subtitle: "Open dues" },
  "/investments": { title: "Investments", subtitle: "Portfolio" },
  "/assets": { title: "Assets", subtitle: "Net worth" },
  "/settings": { title: "Settings", subtitle: "Workspace setup" }
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, state, syncing, signOut } = usePocketFlow();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navLoading, setNavLoading] = useState(false);
  const page = pageMeta[pathname] ?? { title: "PocketFlow", subtitle: "Private workspace" };
  const displayName = profile?.fullName || state.userSettings.profileName || profile?.email || state.userSettings.email || "PocketFlow user";

  useEffect(() => {
    setNavLoading(false);
  }, [pathname]);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
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
                  prefetch
                  onClick={() => setNavLoading(true)}
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

        <div className="flex min-h-screen flex-col pb-24 lg:pb-0">
          <header className="sticky top-0 z-40 border-b border-white/6 bg-background/92 px-4 py-3 backdrop-blur md:px-6 md:py-4">
            {syncing || navLoading ? <div className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-primary/80" /> : null}
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  variant="secondary"
                  className="h-11 w-11 rounded-[18px] p-0 lg:hidden"
                  aria-label="Open menu"
                  onClick={() => setDrawerOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                  <p className="truncate text-[11px] uppercase tracking-[0.16em] text-muted">{page.subtitle}</p>
                  <h1 className="truncate text-base font-semibold md:text-2xl">{page.title}</h1>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted md:block">
                  {displayName}
                </div>
                <Button variant="secondary" onClick={handleSignOut} className="hidden gap-2 sm:inline-flex">
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                  {syncing ? "Saving..." : "Sign out"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleSignOut}
                  className="h-12 w-12 rounded-[20px] p-0 sm:hidden"
                  aria-label="Sign out"
                >
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </header>

          <main data-export-root className="flex-1 px-4 py-4 md:px-6 md:py-8">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-50 rounded-[24px] border border-white/10 bg-[#121826]/95 px-2 py-2 shadow-glow backdrop-blur lg:hidden">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {mobileNavigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                prefetch
                onClick={() => setNavLoading(true)}
                className={cn(
                  "min-w-[4.6rem] flex-1 shrink-0 rounded-2xl px-2 py-3 text-center text-[11px] transition",
                  active ? "bg-primary text-black" : "text-muted hover:text-white"
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <Icon className="h-4 w-4" />
                  <span>{item.shortLabel}</span>
                </div>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="min-w-[4.6rem] flex-1 shrink-0 rounded-2xl px-2 py-3 text-center text-[11px] text-muted transition hover:text-white"
          >
            <div className="flex flex-col items-center gap-1">
              <Menu className="h-4 w-4" />
              <span>More</span>
            </div>
          </button>
        </div>
      </nav>

      {drawerOpen ? (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Close menu" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[86%] max-w-sm border-r border-white/10 bg-[#0b1222] p-5 shadow-glow">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">PocketFlow</p>
                <p className="mt-1 text-xl font-semibold">Workspace menu</p>
              </div>
              <Button variant="secondary" className="h-11 w-11 rounded-[18px] p-0" onClick={() => setDrawerOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="mt-1 text-sm text-muted">{profile?.email || state.userSettings.email || "Signed in"}</p>
            </div>

            <div className="mt-6 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    prefetch
                    onClick={() => { setDrawerOpen(false); setNavLoading(true); }}
                    className={cn(
                      "flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition",
                      active ? "bg-primary text-black" : "border border-white/8 bg-white/[0.03] text-white"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    <span className="text-xs opacity-70">Open</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 space-y-3">
              <Button variant="secondary" onClick={() => window.print()} className="w-full gap-2">
                <FileText className="h-4 w-4" />
                Export current screen
              </Button>
              <Button variant="secondary" onClick={handleSignOut} className="w-full gap-2">
                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                {syncing ? "Signing out..." : "Sign out"}
              </Button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
