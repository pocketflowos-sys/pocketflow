"use client";

import { useEffect, useMemo, useState, type ReactNode, type ComponentType } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CreditCard,
  FileText,
  FolderKanban,
  HandCoins,
  Home,
  Landmark,
  Loader2,
  LogOut,
  Mail,
  Menu,
  Package,
  PiggyBank,
  ReceiptText,
  Settings,
  ShieldCheck,
  UserRound,
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
  { href: "/lend-borrow", label: "Lend/Borrow", shortLabel: "Dues", icon: HandCoins },
  { href: "/credit-cards", label: "Credit Cards", shortLabel: "Cards", icon: CreditCard },
  { href: "/loans", label: "Loans & EMI", shortLabel: "Loans", icon: ReceiptText },
  { href: "/investments", label: "Investments", shortLabel: "Invest", icon: Landmark },
  { href: "/assets", label: "Assets", shortLabel: "Assets", icon: Package },
  { href: "/categories", label: "Categories", shortLabel: "Cat", icon: FolderKanban },
  { href: "/settings", label: "Settings", shortLabel: "Settings", icon: Settings }
];

const mobileNavigation = navigation.filter((item) => ["/dashboard", "/transactions", "/lend-borrow", "/credit-cards", "/loans"].includes(item.href));

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Overview", subtitle: "PocketFlow workspace" },
  "/transactions": { title: "Transactions", subtitle: "Money movement" },
  "/budgets": { title: "Budgets", subtitle: "Monthly plan" },
  "/lend-borrow": { title: "Lend / Borrow", subtitle: "Open dues" },
  "/credit-cards": { title: "Credit Cards", subtitle: "Card tracking" },
  "/loans": { title: "Loans & EMI", subtitle: "Debt tracking" },
  "/investments": { title: "Investments", subtitle: "Portfolio" },
  "/assets": { title: "Assets", subtitle: "Net worth" },
  "/categories": { title: "Categories", subtitle: "Drill-down view" },
  "/settings": { title: "Settings", subtitle: "Workspace setup" }
};

function getReadableName(name: string, email: string) {
  const trimmedName = name.trim();
  if (trimmedName) return trimmedName;
  const emailPrefix = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  if (!emailPrefix) return "PocketFlow user";
  return emailPrefix
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "PF";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, state, authEmail, authName, loading, syncing, signOut } = usePocketFlow();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navLoading, setNavLoading] = useState(false);
  const page = pageMeta[pathname] ?? { title: "PocketFlow", subtitle: "Private workspace" };

  const accountEmail = useMemo(
    () => profile?.email?.trim() || state.userSettings.email?.trim() || authEmail.trim() || "",
    [authEmail, profile?.email, state.userSettings.email]
  );
  const displayName = useMemo(
    () => getReadableName(profile?.fullName || state.userSettings.profileName || authName, accountEmail),
    [accountEmail, authName, profile?.fullName, state.userSettings.profileName]
  );
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  useEffect(() => {
    setNavLoading(false);
  }, [pathname]);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10 text-foreground">
        <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-center shadow-glow">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-primary/12 text-primary">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold">Loading your workspace</h2>
          <p className="mt-3 text-sm text-muted">Fetching your latest data and preparing the app shell...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-white/6 bg-white/[0.03] p-6 text-foreground lg:block">
          <Link href="/" className="flex items-center gap-3 text-xl font-semibold">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-black">
              <Wallet className="h-5 w-5" />
            </div>
            PocketFlow
          </Link>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{displayName}</p>
                <p className="truncate text-sm text-muted">{accountEmail || "Signed in account"}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-2">
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
                    active ? "bg-primary text-black" : "text-muted hover:bg-white/5 hover:text-foreground"
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
              <ShieldCheck className="h-4 w-4" /> Current offer active
            </p>
            <p className="mt-2 text-sm text-muted">One-time access, fast sync, mobile-first layout, and cross-device finance tracking.</p>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col pb-24 lg:pb-0">
          <header className="sticky top-0 z-40 border-b border-white/6 bg-background/92 px-4 py-3 backdrop-blur md:px-6 md:py-4">
            {syncing || navLoading ? <div className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-primary/80" /> : null}
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Button variant="secondary" className="h-11 w-11 rounded-[18px] p-0 lg:hidden" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
                  <Menu className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                  <p className="truncate text-[11px] uppercase tracking-[0.16em] text-muted">{page.subtitle}</p>
                  <h1 className="truncate text-base font-semibold md:text-2xl">{page.title}</h1>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm md:flex">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-[11px] font-semibold text-primary">
                    {initials}
                  </div>
                  <div className="min-w-0 max-w-[16rem]">
                    <p className="truncate font-medium text-foreground">{displayName}</p>
                    <p className="truncate text-xs text-muted">{accountEmail || "Signed in account"}</p>
                  </div>
                </div>
                <Button variant="secondary" onClick={handleSignOut} className="hidden gap-2 sm:inline-flex">
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                  {syncing ? "Working..." : "Sign out"}
                </Button>
                <Button variant="secondary" onClick={handleSignOut} className="h-12 w-12 rounded-[20px] p-0 sm:hidden" aria-label="Sign out">
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </header>

          <main data-export-root className="flex-1 px-4 py-4 text-foreground md:px-6 md:py-8">{children}</main>
        </div>
      </div>

      <nav className="surface fixed inset-x-3 bottom-3 z-50 rounded-[24px] px-2 py-2 shadow-glow backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-hide">
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
                  "min-w-[3.35rem] flex-1 shrink-0 rounded-2xl px-1.5 py-2.5 text-center text-[10px] transition",
                  active ? "bg-primary text-black shadow-soft" : "text-muted hover:text-foreground"
                )}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <Icon className="h-4 w-4" />
                  <span className="leading-none">{item.shortLabel}</span>
                </div>
              </Link>
            );
          })}
          <button type="button" onClick={() => setDrawerOpen(true)} className="min-w-[3.35rem] flex-1 shrink-0 rounded-2xl px-1.5 py-2.5 text-center text-[10px] text-muted transition hover:text-foreground">
            <div className="flex flex-col items-center gap-1.5">
              <Menu className="h-4 w-4" />
              <span className="leading-none">More</span>
            </div>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {drawerOpen ? (
          <motion.div className="fixed inset-0 z-[90] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Close menu" onClick={() => setDrawerOpen(false)} />
            <motion.aside initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ type: "spring", stiffness: 280, damping: 28 }} className="absolute left-0 top-0 h-full w-[88%] max-w-sm border-r border-white/10 bg-background/95 p-5 text-foreground shadow-glow backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">PocketFlow</p>
                  <p className="mt-1 text-xl font-semibold">Workspace menu</p>
                </div>
                <Button variant="secondary" className="h-11 w-11 rounded-[18px] p-0" onClick={() => setDrawerOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-sm font-semibold text-primary">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold">{displayName}</p>
                    <p className="mt-1 truncate text-sm text-muted">{accountEmail || "Signed in account"}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                        <UserRound className="h-3.5 w-3.5" /> Account
                      </span>
                      {accountEmail ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                          <Mail className="h-3.5 w-3.5" /> Email saved
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link key={item.label} href={item.href} prefetch onClick={() => { setDrawerOpen(false); setNavLoading(true); }} className={cn("flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition", active ? "bg-primary text-black" : "border border-white/8 bg-white/[0.03] text-foreground") }>
                      <span className="flex min-w-0 items-center gap-3"><Icon className="h-4 w-4 shrink-0" />{item.label}</span>
                      <span className="inline-flex items-center gap-1 text-xs opacity-70">Open <ArrowRight className="h-3 w-3" /></span>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-6 space-y-3">
                <Button variant="secondary" onClick={() => window.print()} className="w-full gap-2"><FileText className="h-4 w-4" />Export current screen</Button>
                <Button variant="secondary" onClick={handleSignOut} className="w-full gap-2">{syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}{syncing ? "Signing out..." : "Sign out"}</Button>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
