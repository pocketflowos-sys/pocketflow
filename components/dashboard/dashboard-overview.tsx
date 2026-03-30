"use client";

import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, ChevronDown, CreditCard, HandCoins, Landmark, Package, Plus, ReceiptText, Sparkles } from "lucide-react";
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

function MetricCard({ title, value, detail, tone = "neutral", href }: { title: string; value: string; detail: string; tone?: "neutral" | "green" | "red"; href?: Route }) {
  const content = (
    <Card className="h-full p-5 transition hover:border-primary/25 hover:bg-white/[0.05]">
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className={`mt-2 text-sm ${tone === "green" ? "text-success" : tone === "red" ? "text-danger" : "text-muted"}`}>{detail}</p>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function MobileMiniStat({ title, value, tone = "neutral", onAdd, href }: { title: string; value: string; tone?: "neutral" | "green" | "red"; onAdd?: () => void; href?: Route }) {
  function handleAddClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    onAdd?.();
  }

  const inner = (
    <Card className="rounded-[24px] p-4 transition hover:border-primary/25 hover:bg-white/[0.05]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{title}</p>
          <p className={`mt-2 text-2xl font-semibold ${tone === "green" ? "text-success" : tone === "red" ? "text-danger" : "text-white"}`}>{value}</p>
        </div>
        {onAdd ? <Button variant="secondary" className="h-9 w-9 rounded-2xl p-0" onClick={handleAddClick} aria-label={`Add to ${title}`}><Plus className="h-4 w-4" /></Button> : null}
      </div>
    </Card>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
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

const quickTabLabel = {
  Transaction: "Add transaction",
  "Lend/Borrow": "Add due",
  Investment: "Add investment",
  Asset: "Add asset"
} as const;

export function DashboardOverview() {
  const dashboard = useDashboardData();
  const { state, operationError } = usePocketFlow();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickTab, setQuickTab] = useState<"Transaction" | "Lend/Borrow" | "Investment" | "Asset">("Transaction");
  const [quickPreset, setQuickPreset] = useState<Record<string, string | undefined>>({});

  const mobileRecentTransactions = useMemo(() => dashboard.recentTransactions.slice(0, 3), [dashboard.recentTransactions]);
  const mobileUpcomingDueItems = useMemo(() => dashboard.upcomingDueItems.slice(0, 2), [dashboard.upcomingDueItems]);

  function openQuickAdd(tab: typeof quickTab, preset?: Record<string, string | undefined>) {
    setQuickTab(tab);
    setQuickPreset(preset ?? {});
    setQuickAddOpen(true);
  }

  return (
    <AppShell>
      {operationError ? <div className="mb-6 rounded-3xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{operationError}</div> : null}

      <section className="hidden md:block">
        <section className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted">Your live finance workspace with synced updates across tabs and devices.</p>
            <h2 className="text-2xl font-semibold">Fast overview with money, dues, cards, loans, and assets</h2>
          </div>
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted">Auto sync</div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard href="/transactions" title="Current balance" value={formatCurrency(dashboard.currentBalance, state.userSettings.currency)} detail="Income minus expenses only" />
          <MetricCard href="/transactions" title="Total income" value={formatCurrency(dashboard.totalIncome, state.userSettings.currency)} detail="Saved income entries" tone="green" />
          <MetricCard href="/transactions" title="Total expenses" value={formatCurrency(dashboard.totalExpenses, state.userSettings.currency)} detail="Saved expense entries" tone="red" />
          <MetricCard title="Savings rate" value={`${Math.max(dashboard.savingsRate, 0).toFixed(0)}%`} detail="Based on income minus expenses" tone="green" />
          <MetricCard href="/budgets" title="Budget used" value={formatPercent(dashboard.budgetUsed)} detail="Current month spend vs budget" />
          <MetricCard href="/lend-borrow" title="Receivables" value={formatCurrency(dashboard.receivables, state.userSettings.currency)} detail="Money you should receive" tone="green" />
          <MetricCard href="/lend-borrow" title="Payables" value={formatCurrency(dashboard.payables, state.userSettings.currency)} detail="Money you still need to pay" tone="red" />
          <MetricCard href="/credit-cards" title="Credit card due" value={formatCurrency(dashboard.creditOutstanding, state.userSettings.currency)} detail="Outstanding across all cards" tone={dashboard.creditOutstanding > 0 ? "red" : "green"} />
          <MetricCard href="/loans" title="Loan outstanding" value={formatCurrency(dashboard.totalLoanOutstanding, state.userSettings.currency)} detail="Remaining loan amount" tone={dashboard.totalLoanOutstanding > 0 ? "red" : "green"} />
          <MetricCard href="/loans" title="Monthly EMI load" value={formatCurrency(dashboard.totalEmiAmount, state.userSettings.currency)} detail="Total EMI amount tracked" />
          <MetricCard href="/investments" title="Investments value" value={formatCurrency(dashboard.totalInvestments, state.userSettings.currency)} detail="Current value of saved investments" />
          <MetricCard href="/assets" title="Assets value" value={formatCurrency(dashboard.assetsValue, state.userSettings.currency)} detail="Current worth of tracked assets" />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <Card className="p-5 md:p-6">
            <SectionIntro title="Expense by category" description="Your current month expense split." action={<Link href="/categories"><Badge tone="neutral">Drill down</Badge></Link>} />
            <ExpenseCategoryChart data={dashboard.expenseByCategory} />
          </Card>

          <Card className="p-5 md:p-6">
            <SectionIntro title="Income vs expense" description="Last six months from your entries." action={<Badge tone="neutral">Live data</Badge>} />
            <IncomeExpenseChart data={dashboard.incomeVsExpense} />
          </Card>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5 md:p-6">
            <SectionIntro title="Investment summary" description="Track your portfolio growth and savings momentum." action={<Link href="/investments"><Badge tone="gold">Portfolio value</Badge></Link>} />
            <InvestmentChart data={dashboard.investmentGrowth} />
          </Card>

          <Card className="p-5 md:p-6">
            <SectionIntro title="Budget progress" description="Budget consumption this month." action={<Badge tone="neutral">Current month</Badge>} />
            <BudgetChart value={dashboard.budgetUsed} />
          </Card>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="p-5 md:p-6">
            <SectionIntro title="Recent transactions" description="Latest money movement in your system." action={<Link href="/transactions"><Button variant="secondary">Open page</Button></Link>} />
            <div className="space-y-3">
              {dashboard.recentTransactions.length === 0 ? <EmptyHint>Add your first transaction to bring the dashboard to life.</EmptyHint> : null}
              {dashboard.recentTransactions.map((item) => (
                <Link key={item.id} href={`/categories?group=${item.type}&category=${encodeURIComponent(item.category)}`} className="block rounded-3xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-primary/20 hover:bg-white/[0.05]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-sm text-muted">{item.category} • {item.dateLabel}</p>
                    </div>
                    <div className={`font-semibold ${item.type === "income" ? "text-success" : "text-danger"}`}>{item.type === "income" ? "+" : "-"}{formatCurrency(item.amount, state.userSettings.currency)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-5 md:p-6">
            <SectionIntro title="Upcoming due items" description="Lending and borrowing reminders." action={<Button variant="secondary" className="gap-2" onClick={() => openQuickAdd("Lend/Borrow")}><Plus className="h-4 w-4" />Add</Button>} />
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
        <div className="space-y-4">
          <Card className="overflow-hidden p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Live summary</p>
                <p className="mt-2 text-sm text-muted">Current balance</p>
                <p className="mt-2 text-4xl font-semibold">{formatCurrency(dashboard.currentBalance, state.userSettings.currency)}</p>
                <p className="mt-2 text-sm text-muted">Income minus expense only, separate from receivables and payables.</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge tone="green">Live</Badge>
              </div>
            </div>
          </Card>

          <section className="grid grid-cols-2 gap-3">
            <MobileMiniStat title="Income" value={formatCurrency(dashboard.totalIncome, state.userSettings.currency)} tone="green" href="/transactions" onAdd={() => openQuickAdd("Transaction", { transactionType: "income" })} />
            <MobileMiniStat title="Expenses" value={formatCurrency(dashboard.totalExpenses, state.userSettings.currency)} tone="red" href="/transactions" onAdd={() => openQuickAdd("Transaction", { transactionType: "expense" })} />
            <MobileMiniStat title="Savings" value={`${Math.max(dashboard.savingsRate, 0).toFixed(0)}%`} tone="green" />
            <MobileMiniStat title="Budget used" value={formatPercent(dashboard.budgetUsed)} href="/budgets" />
            <MobileMiniStat title="Receivables" value={formatCurrency(dashboard.receivables, state.userSettings.currency)} tone="green" href="/lend-borrow" onAdd={() => openQuickAdd("Lend/Borrow", { lendBorrowType: "given" })} />
            <MobileMiniStat title="Payables" value={formatCurrency(dashboard.payables, state.userSettings.currency)} tone="red" href="/lend-borrow" onAdd={() => openQuickAdd("Lend/Borrow", { lendBorrowType: "borrowed" })} />
            <MobileMiniStat title="Cards due" value={formatCurrency(dashboard.creditOutstanding, state.userSettings.currency)} tone={dashboard.creditOutstanding > 0 ? "red" : "green"} href="/credit-cards" />
            <MobileMiniStat title="EMI load" value={formatCurrency(dashboard.totalEmiAmount, state.userSettings.currency)} href="/loans" />
            <MobileMiniStat title="Investments" value={formatCurrency(dashboard.totalInvestments, state.userSettings.currency)} href="/investments" onAdd={() => openQuickAdd("Investment")} />
            <MobileMiniStat title="Assets" value={formatCurrency(dashboard.assetsValue, state.userSettings.currency)} href="/assets" onAdd={() => openQuickAdd("Asset")} />
          </section>

          <Card className="p-4">
            <SectionIntro title="Upcoming due items" description={dashboard.upcomingDueItems.length > 0 ? "Your urgent lend and borrow reminders." : "No urgent reminders right now."} action={<Button variant="secondary" className="gap-2 px-3 py-2 text-xs" onClick={() => openQuickAdd("Lend/Borrow")}><Plus className="h-4 w-4" />Add</Button>} />
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
            <SectionIntro title="Recent transactions" description="Latest entries from your synced workspace." action={<Link href="/transactions"><Button variant="secondary" className="px-3 py-2 text-xs">Open page</Button></Link>} />
            <div className="space-y-3">
              {mobileRecentTransactions.length === 0 ? <EmptyHint>Add your first transaction to bring the dashboard to life.</EmptyHint> : null}
              {mobileRecentTransactions.map((item) => (
                <Link key={item.id} href={`/categories?group=${item.type}&category=${encodeURIComponent(item.category)}`} className="block rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.title}</p>
                      <p className="mt-1 truncate text-sm text-muted">{item.category} • {item.dateLabel}</p>
                    </div>
                    <div className={`shrink-0 text-right font-semibold ${item.type === "income" ? "text-success" : "text-danger"}`}>{item.type === "income" ? "+" : "-"}{formatCurrency(item.amount, state.userSettings.currency)}</div>
                  </div>
                </Link>
              ))}
              <Link href="/transactions" className="block"><Button variant="secondary" className="w-full">View all transactions</Button></Link>
            </div>
          </Card>

          <Card className="p-4">
            <SectionIntro title="Card & loan snapshot" description="Track dues, EMIs, investments, and assets in one glance." action={<Link href="/credit-cards"><Button variant="secondary" className="px-3 py-2 text-xs">Open cards</Button></Link>} />
            <div className="grid grid-cols-2 gap-3">
              <Link href="/credit-cards" className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-sm text-muted">Cards due</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(dashboard.creditOutstanding, state.userSettings.currency)}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-primary">View details <ArrowRight className="h-3.5 w-3.5" /></span>
              </Link>
              <Link href="/loans" className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-sm text-muted">Loan outstanding</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(dashboard.totalLoanOutstanding, state.userSettings.currency)}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-primary">View details <ArrowRight className="h-3.5 w-3.5" /></span>
              </Link>
              <Link href="/investments" className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-sm text-muted">Investments</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(dashboard.totalInvestments, state.userSettings.currency)}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-primary">View details <ArrowRight className="h-3.5 w-3.5" /></span>
              </Link>
              <Link href="/assets" className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-sm text-muted">Assets</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(dashboard.assetsValue, state.userSettings.currency)}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-primary">View details <ArrowRight className="h-3.5 w-3.5" /></span>
              </Link>
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
              <Card className="p-4"><SectionIntro title="Budget progress" description="This month spend vs plan." action={<Badge tone="neutral">Now</Badge>} /><BudgetChart value={dashboard.budgetUsed} /></Card>
              <Card className="p-4"><SectionIntro title="Expense by category" description="Current month expense split." action={<Link href="/categories"><Badge tone="neutral">Category page</Badge></Link>} /><ExpenseCategoryChart data={dashboard.expenseByCategory} /></Card>
              <Card className="p-4"><SectionIntro title="Income vs expense" description="Last six months." action={<Badge tone="neutral">Trend</Badge>} /><IncomeExpenseChart data={dashboard.incomeVsExpense} /></Card>
              <Card className="p-4"><SectionIntro title="Investment growth" description="Your portfolio trend." action={<Button variant="secondary" className="gap-2 px-3 py-2 text-xs" onClick={(event) => { event.preventDefault(); openQuickAdd("Investment"); }}><Plus className="h-4 w-4" />Add</Button>} /><InvestmentChart data={dashboard.investmentGrowth} /></Card>
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
            <QuickAdd initialTab={quickTab} compact preset={quickPreset as any} onSuccess={() => setQuickAddOpen(false)} />
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
