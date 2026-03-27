"use client";

import { ArrowDownLeft, ArrowUpRight, CircleAlert, Landmark, WalletCards } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { BudgetChart } from "@/components/charts/budget-chart";
import { ExpenseCategoryChart } from "@/components/charts/expense-category-chart";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { InvestmentChart } from "@/components/charts/investment-chart";
import { QuickAdd } from "@/components/dashboard/quick-add";
import { ResetDemoButton } from "@/components/dashboard/reset-demo-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCompactDate, formatCurrency } from "@/lib/formatters";
import { useDashboardData, usePocketFlow } from "@/lib/pocketflow-store";

function MetricCard({
  title,
  value,
  detail,
  tone = "neutral"
}: {
  title: string;
  value: string;
  detail: string;
  tone?: "neutral" | "green" | "red";
}) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p
        className={`mt-2 text-sm ${
          tone === "green"
            ? "text-success"
            : tone === "red"
              ? "text-danger"
              : "text-muted"
        }`}
      >
        {detail}
      </p>
    </Card>
  );
}

export function DashboardOverview() {
  const dashboard = useDashboardData();
  const { state } = usePocketFlow();

  return (
    <AppShell>
      <section className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted">Phase 4 adds functional investments, assets, and settings managers.</p>
          <h2 className="text-2xl font-semibold">Live dashboard with deeper money control</h2>
        </div>
        <ResetDemoButton />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Current balance"
          value={formatCurrency(dashboard.currentBalance, state.userSettings.currency)}
          detail="After expenses, open dues, and receivables"
        />
        <MetricCard
          title="Total income"
          value={formatCurrency(dashboard.totalIncome, state.userSettings.currency)}
          detail="Live total from saved entries"
          tone="green"
        />
        <MetricCard
          title="Total expenses"
          value={formatCurrency(dashboard.totalExpenses, state.userSettings.currency)}
          detail="Updates instantly when you save"
          tone="red"
        />
        <MetricCard
          title="Savings rate"
          value={`${Math.max(dashboard.savingsRate, 0).toFixed(0)}%`}
          detail="Based on income minus expenses"
          tone="green"
        />
        <MetricCard
          title="Budget used"
          value={`${dashboard.budgetUsed.toFixed(0)}%`}
          detail="Current month spend vs budget"
        />
        <MetricCard
          title="Receivables"
          value={formatCurrency(dashboard.receivables, state.userSettings.currency)}
          detail="Money you should receive"
          tone="green"
        />
        <MetricCard
          title="Payables"
          value={formatCurrency(dashboard.payables, state.userSettings.currency)}
          detail="Money you still need to pay"
          tone="red"
        />
        <MetricCard
          title="Investments value"
          value={formatCurrency(dashboard.totalInvestments, state.userSettings.currency)}
          detail="Current value of saved investments"
        />
      </section>

      <section className="mt-6">
        <QuickAdd />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xl font-semibold">Expense by category</p>
              <p className="mt-1 text-sm text-muted">Your current month expense split.</p>
            </div>
            <Badge tone="neutral">Auto update</Badge>
          </div>
          <ExpenseCategoryChart data={dashboard.expenseByCategory} />
        </Card>

        <Card className="p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xl font-semibold">Income vs expense</p>
              <p className="mt-1 text-sm text-muted">Last six months from your entries.</p>
            </div>
            <Badge tone="neutral">Live data</Badge>
          </div>
          <IncomeExpenseChart data={dashboard.incomeVsExpense} />
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xl font-semibold">Investment summary</p>
              <p className="mt-1 text-sm text-muted">
                Add investments from Quick Add and watch this grow.
              </p>
            </div>
            <Badge tone="gold">Portfolio value</Badge>
          </div>
          <InvestmentChart data={dashboard.investmentGrowth} />
        </Card>

        <Card className="p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xl font-semibold">Budget progress</p>
              <p className="mt-1 text-sm text-muted">Budget consumption this month.</p>
            </div>
            <Badge tone="neutral">Current month</Badge>
          </div>
          <BudgetChart value={dashboard.budgetUsed} />
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xl font-semibold">Recent transactions</p>
              <p className="mt-1 text-sm text-muted">Latest money movement in your system.</p>
            </div>
            <Badge tone="neutral">Saved locally</Badge>
          </div>

          <div className="space-y-3">
            {dashboard.recentTransactions.map((item) => {
              const positive = item.type === "income";
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-3xl border border-white/8 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                        positive ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                      }`}
                    >
                      {positive ? (
                        <ArrowDownLeft className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-sm text-muted">
                        {item.category} • {item.dateLabel}
                      </p>
                    </div>
                  </div>
                  <div className={`font-semibold ${positive ? "text-success" : "text-danger"}`}>
                    {positive ? "+" : "-"}
                    {formatCurrency(item.amount, state.userSettings.currency)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xl font-semibold">Upcoming due items</p>
              <p className="mt-1 text-sm text-muted">Lending and borrowing reminders.</p>
            </div>
            <Badge tone={dashboard.overdueCount > 0 ? "red" : "neutral"}>
              {dashboard.overdueCount} overdue
            </Badge>
          </div>

          <div className="space-y-3">
            {dashboard.upcomingDueItems.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-white/8 bg-white/[0.03] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-2xl bg-primary/12 p-2 text-primary">
                      <WalletCards className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{item.person}</p>
                      <p className="mt-1 text-sm text-muted">
                        {item.type === "given" ? "Given" : "Borrowed"} • due {item.dueDate ? formatCompactDate(item.dueDate) : formatCompactDate(item.date)}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.balance, state.userSettings.currency)}</p>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <Badge tone={item.status === "Overdue" ? "red" : "neutral"}>{item.status}</Badge>
                  {item.status === "Overdue" ? (
                    <span className="flex items-center gap-1 text-danger">
                      <CircleAlert className="h-4 w-4" />
                      Action needed
                    </span>
                  ) : (
                    <span className="text-muted">On track</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="flex items-center justify-between p-5 md:p-6">
          <div>
            <p className="text-lg font-semibold">Open investments page</p>
            <p className="mt-1 text-sm text-muted">Review holdings, returns, filters, and edit each entry.</p>
          </div>
          <a href="/investments" className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-black">
            <Landmark className="h-4 w-4" />
            View investments
          </a>
        </Card>
        <Card className="p-5 md:p-6">
          <p className="text-lg font-semibold">Profile mode</p>
          <p className="mt-1 text-sm text-muted">
            Currency and default lists now come from Settings, so pages and Quick Add stay in sync.
          </p>
        </Card>
      </section>
    </AppShell>
  );
}
