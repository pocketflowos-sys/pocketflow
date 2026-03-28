"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, BarChart3, ChevronDown, HandCoins, Landmark, Package, Plus, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { BudgetChart } from "@/components/charts/budget-chart";
import { ExpenseCategoryChart } from "@/components/charts/expense-category-chart";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { InvestmentChart } from "@/components/charts/investment-chart";
import { QuickAdd } from "@/components/dashboard/quick-add";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { useDashboardData, usePocketFlow } from "@/lib/pocketflow-store";

function MetricCard({ title, value, detail, tone = "neutral" }: { title: string; value: string; detail: string; tone?: "neutral" | "green" | "red" }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className={`mt-2 text-sm ${tone === "green" ? "text-success" : tone === "red" ? "text-danger" : "text-muted"}`}>{detail}</p>
    </Card>
  );
}

function MobileMiniStat({
  title,
  value,
  tone = "neutral",
  onAdd
}: {
  title: string;
  value: string;
  tone?: "neutral" | "green" | "red";
  onAdd?: () => void;
}) {
  return (
    <Card className="rounded-[24px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{title}</p>
          <p className={`mt-2 text-2xl font-semibold ${tone === "green" ? "text-success" : tone === "red" ? "text-danger" : "text-white"}`}>{value}</p>
        </div>
        {onAdd ? (
          <Button variant="secondary" className="h-9 w-9 rounded-2xl p-0" onClick={onAdd} aria-label={`Add to ${title}`}>
            <Plus className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

function SectionIntro({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <p className="text-xl font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyHint({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-muted">{children}</div>;
}

const quickTabLabel: Record<"Transaction" | "Lend/Borrow" | "Investment" | "Asset", string> = {
  Transaction: "Add transaction",
  "Lend/Borrow": "Add due",
  Investment: "Add investment",
  Asset: "Add asset"
};

export function DashboardOverview() {
  const dashboard = useDashboardData();
  const { state, operationError } = usePocketFlow();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickTab, setQuickTab] = useState<"Transaction" | "Lend/Borrow" | "Investment" | "Asset">("Transaction");

  const mobileRecentTransactions = useMemo(() => dashboard.recentTransactions.slice(0, 3), [dashboard.recentTransactions]);
  const mobileUpcomingDueItems = useMemo(() => dashboard.upcomingDueItems.slice(0, 2), [dashboard.upcomingDueItems]);

  function openQuickAdd(tab: typeof quickTab) {
    setQuickTab(tab);
    setQuickAddOpen(true);
  }

  return (
    <AppShell>
      {operationError ? (
        <div className="mb-6 rounded-3xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{operationError}</div>
      ) : null}

      <section className="hidden md:block">
        <section className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted">Your live financial workspace powered by Supabase.</p>
            <h2 className="text-2xl font-semibold">Real dashboard with synced money control</h2>
          </div>
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted">Live sync</div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Tracked balance" value={formatCurrency(dashboard.trackedBalance, state.userSettings.currency)} detail="Estimate from income, expenses, receivables, and payables" />
          <MetricCard title="Total income" value={formatCurrency(dashboard.totalIncome, state.userSettings.currency)} detail="Live total from saved entries" tone="green" />
          <MetricCard title="Total expenses" value={formatCurrency(dashboard.totalExpenses, state.userSettings.currency)} detail="Updates instantly when you save" tone="red" />
          <MetricCard title="Savings rate" value={`${Math.max(dashboard.savingsRate, 0).toFixed(0)}%`} detail="Based on income minus expenses" tone="green" />
          <MetricCard title="Budget used" value={formatPercent(dashboard.budgetUsed)} detail="Current month spend vs budget" />
          <MetricCard title="Receivables" value={formatCurrency(dashboard.receivables, state.userSettings.currency)} detail="Money you should receive" tone="green" />
          <MetricCard title="Payables" value={formatCurrency(dashboard.payables, state.userSettings.currency)} detail="Money you still need to pay" tone="red" />
          <MetricCard title="Investments value" value={formatCurrency(dashboard.totalInvestments, state.userSettings.currency)} detail="Current value of saved investments" />
          <MetricCard title="Assets value" value={formatCurrency(dashboard.assetsValue, state.userSettings.currency)} detail="Current worth of tracked assets" />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <Card className="p-5 md:p-6">
            <SectionIntro title="Expense by category" description="Your current month expense split." action={<Badge tone="neutral">Auto update</Badge>} />
            <ExpenseCategoryChart data={dashboard.expenseByCategory} />
          </Card>

          <Card className="p-5 md:p-6">
            <SectionIntro title="Income vs expense" description="Last six months from your entries." action={<Badge tone="neutral">Live data</Badge>} />
            <IncomeExpenseChart data={dashboard.incomeVsExpense} />
          </Card>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5 md:p-6">
            <SectionIntro title="Investment summary" description="Add investments from Quick Add and track them live." action={<Badge tone="gold">Portfolio value</Badge>} />
            <InvestmentChart data={dashboard.investmentGrowth} />
          </Card>

          <Card className="p-5 md:p-6">
            <SectionIntro title="Budget progress" description="Budget consumption this month." action={<Badge tone="neutral">Current month</Badge>} />
            <BudgetChart value={dashboard.budgetUsed} />
          </Card>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="p-5 md:p-6">
            <SectionIntro
              title="Recent transactions"
              description="Latest money movement in your system."
              action={<Button variant="secondary" className="gap-2" onClick={() => openQuickAdd("Transaction")}><Plus className="h-4 w-4" />Add</Button>}
            />
            <div className="space-y-3">
              {dashboard.recentTransactions.length === 0 ? <EmptyHint>Add your first transaction to bring the dashboard to life.</EmptyHint> : null}
              {dashboard.recentTransactions.map((item) => {
                const positive = item.type === "income";
                return (
                  <div key={item.id} className="flex items-center justify-between rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${positive ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
                        {positive ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="mt-1 text-sm text-muted">{item.category} • {item.dateLabel}</p>
                      </div>
                    </div>
                    <div className={`font-semibold ${positive ? "text-success" : "text-danger"}`}>{positive ? "+" : "-"}{formatCurrency(item.amount, state.userSettings.currency)}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-5 md:p-6">
            <SectionIntro
              title="Upcoming due items"
              description="Lending and borrowing reminders."
              action={<Button variant="secondary" className="gap-2" onClick={() => openQuickAdd("Lend/Borrow")}><Plus className="h-4 w-4" />Add</Button>}
            />
            <div className="space-y-3">
              {dashboard.upcomingDueItems.length === 0 ? <EmptyHint>No open lend or borrow reminders right now.</EmptyHint> : null}
              {dashboard.upcomingDueItems.map((item) => (
                <div key={item.id} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.person}</p>
                      <p className="mt-1 text-sm text-muted">{item.type === "given" ? "To receive" : "To pay"}</p>
                    </div>
                    <Badge tone={item.status === "Overdue" ? "red" : "neutral"}>{item.status}</Badge>
                  </div>
                  <p className="mt-3 text-lg font-semibold">{formatCurrency(item.balance, state.userSettings.currency)}</p>
                  <p className="mt-1 text-sm text-muted">Due {item.dueDate ?? item.date}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </section>

      <section className="md:hidden">
        <div className="grid gap-4">
          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Live summary</p>
                <p className="mt-2 text-sm text-muted">Tracked balance</p>
                <p className="mt-2 text-4xl font-semibold">{formatCurrency(dashboard.trackedBalance, state.userSettings.currency)}</p>
                <p className="mt-2 text-sm text-muted">Manual estimate from saved income, expenses, dues, and receivables</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge tone="green">Live</Badge>
                <Button variant="secondary" className="h-10 rounded-2xl px-3 text-xs" onClick={() => openQuickAdd("Transaction")}>
                  <Plus className="mr-1 h-4 w-4" />Add
                </Button>
              </div>
            </div>
          </Card>

          <section className="grid grid-cols-2 gap-3">
            <MobileMiniStat title="Income" value={formatCurrency(dashboard.totalIncome, state.userSettings.currency)} tone="green" onAdd={() => openQuickAdd("Transaction")} />
            <MobileMiniStat title="Expenses" value={formatCurrency(dashboard.totalExpenses, state.userSettings.currency)} tone="red" onAdd={() => openQuickAdd("Transaction")} />
            <MobileMiniStat title="Savings" value={`${Math.max(dashboard.savingsRate, 0).toFixed(0)}%`} tone="green" onAdd={() => openQuickAdd("Transaction")} />
            <MobileMiniStat title="Budget used" value={formatPercent(dashboard.budgetUsed)} onAdd={() => openQuickAdd("Transaction")} />
            <MobileMiniStat title="Receivables" value={formatCurrency(dashboard.receivables, state.userSettings.currency)} tone="green" onAdd={() => openQuickAdd("Lend/Borrow")} />
            <MobileMiniStat title="Payables" value={formatCurrency(dashboard.payables, state.userSettings.currency)} tone="red" onAdd={() => openQuickAdd("Lend/Borrow")} />
            <MobileMiniStat title="Investments" value={formatCurrency(dashboard.totalInvestments, state.userSettings.currency)} onAdd={() => openQuickAdd("Investment")} />
            <MobileMiniStat title="Assets" value={formatCurrency(dashboard.assetsValue, state.userSettings.currency)} onAdd={() => openQuickAdd("Asset")} />
          </section>

          <Card className="p-4">
            <SectionIntro
              title="Upcoming due items"
              description={dashboard.upcomingDueItems.length > 0 ? "Your urgent lend and borrow reminders." : "No urgent reminders right now."}
              action={<Button variant="secondary" className="gap-2 px-3 py-2 text-xs" onClick={() => openQuickAdd("Lend/Borrow")}><Plus className="h-4 w-4" />Add</Button>}
            />
            <div className="space-y-3">
              {mobileUpcomingDueItems.length === 0 ? <EmptyHint>No open lend or borrow reminders right now.</EmptyHint> : null}
              {mobileUpcomingDueItems.map((item) => (
                <div key={item.id} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.person}</p>
                      <p className="mt-1 text-sm text-muted">{item.type === "given" ? "To receive" : "To pay"}</p>
                    </div>
                    <Badge tone={item.status === "Overdue" ? "red" : "neutral"}>{item.status}</Badge>
                  </div>
                  <p className="mt-3 text-lg font-semibold">{formatCurrency(item.balance, state.userSettings.currency)}</p>
                  <p className="mt-1 text-sm text-muted">Due {item.dueDate ?? item.date}</p>
                </div>
              ))}
              <Link href="/lend-borrow" className="block"><Button variant="secondary" className="w-full">View all due items</Button></Link>
            </div>
          </Card>

          <Card className="p-4">
            <SectionIntro
              title="Recent transactions"
              description="Latest entries from your synced workspace."
              action={<Button variant="secondary" className="gap-2 px-3 py-2 text-xs" onClick={() => openQuickAdd("Transaction")}><Plus className="h-4 w-4" />Add</Button>}
            />
            <div className="space-y-3">
              {mobileRecentTransactions.length === 0 ? <EmptyHint>Add your first transaction to bring the dashboard to life.</EmptyHint> : null}
              {mobileRecentTransactions.map((item) => {
                const positive = item.type === "income";
                return (
                  <div key={item.id} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.title}</p>
                        <p className="mt-1 truncate text-sm text-muted">{item.category} • {item.dateLabel}</p>
                      </div>
                      <div className={`shrink-0 text-right font-semibold ${positive ? "text-success" : "text-danger"}`}>{positive ? "+" : "-"}{formatCurrency(item.amount, state.userSettings.currency)}</div>
                    </div>
                  </div>
                );
              })}
              <Link href="/transactions" className="block"><Button variant="secondary" className="w-full">View all transactions</Button></Link>
            </div>
          </Card>

          <Card className="p-4">
            <SectionIntro
              title="Portfolio snapshot"
              description="Your investments and assets in one glance."
              action={<Button variant="secondary" className="gap-2 px-3 py-2 text-xs" onClick={() => openQuickAdd("Investment")}><Plus className="h-4 w-4" />Add</Button>}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-sm text-muted">Investments</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(dashboard.totalInvestments, state.userSettings.currency)}</p>
                <Link href="/investments" className="mt-3 inline-flex items-center gap-1 text-xs text-primary">View details <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
              <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-sm text-muted">Assets</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(dashboard.assetsValue, state.userSettings.currency)}</p>
                <Link href="/assets" className="mt-3 inline-flex items-center gap-1 text-xs text-primary">View details <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
            </div>
          </Card>

          <details id="mobile-insights" className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] open:bg-white/[0.04]">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4">
              <div>
                <p className="text-xl font-semibold">Insights</p>
                <p className="mt-1 text-sm text-muted">Open charts only when you need deeper analysis.</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="gold"><Sparkles className="h-3.5 w-3.5" /> Expand</Badge>
                <ChevronDown className="h-4 w-4 text-muted transition group-open:rotate-180" />
              </div>
            </summary>
            <div className="space-y-4 border-t border-white/6 px-4 pb-4 pt-2">
              <Card className="p-4">
                <SectionIntro title="Budget progress" description="This month spend vs plan." action={<Badge tone="neutral">Now</Badge>} />
                <BudgetChart value={dashboard.budgetUsed} />
              </Card>
              <Card className="p-4">
                <SectionIntro title="Expense by category" description="Current month expense split." action={<Badge tone="neutral">Auto</Badge>} />
                <ExpenseCategoryChart data={dashboard.expenseByCategory} />
              </Card>
              <Card className="p-4">
                <SectionIntro title="Income vs expense" description="Last six months." action={<Badge tone="neutral">Trend</Badge>} />
                <IncomeExpenseChart data={dashboard.incomeVsExpense} />
              </Card>
              <Card className="p-4">
                <SectionIntro title="Investment growth" description="Your portfolio trend." action={<Button variant="secondary" className="gap-2 px-3 py-2 text-xs" onClick={(e) => { e.preventDefault(); openQuickAdd("Investment"); }}><Plus className="h-4 w-4" />Add</Button>} />
                <InvestmentChart data={dashboard.investmentGrowth} />
              </Card>
            </div>
          </details>
        </div>
      </section>

      {quickAddOpen ? (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setQuickAddOpen(false)} aria-label="Close quick add" />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-[32px] border border-white/10 bg-background p-4 shadow-glow">
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/15" />
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xl font-semibold">{quickTabLabel[quickTab]}</p>
                <p className="mt-1 text-sm text-muted">Fast entry mode for mobile.</p>
              </div>
              <Button variant="secondary" className="px-4 py-2 text-xs" onClick={() => setQuickAddOpen(false)}>Close</Button>
            </div>
            <QuickAdd initialTab={quickTab} compact />
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
