"use client";

import { useMemo, useState } from "react";
import { PencilLine, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { BudgetForm } from "@/components/budgets/budget-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SummaryCard } from "@/components/ui/summary-card";
import { getBudgetStatus } from "@/lib/finance";
import { formatCurrency, formatMonthLabel, formatPercent, getMonthKey, getTodayIso } from "@/lib/formatters";
import { usePocketFlow, usePocketFlowOptions } from "@/lib/pocketflow-store";
import type { Budget } from "@/lib/types";

export function BudgetsPage() {
  const { state, addBudget, updateBudget, deleteBudget } = usePocketFlow();
  const { categories } = usePocketFlowOptions();
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey(getTodayIso()));
  const [editingItem, setEditingItem] = useState<Budget | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const rows = useMemo(() => {
    return state.budgets
      .filter((budget) => budget.month === selectedMonth)
      .map((budget) => {
        const actual = state.transactions
          .filter((item) => item.type === "expense" && item.category === budget.category && getMonthKey(item.date) === selectedMonth)
          .reduce((sum, item) => sum + item.amount, 0);
        const percentUsed = budget.amount > 0 ? (actual / budget.amount) * 100 : 0;
        const difference = budget.amount - actual;
        const status = getBudgetStatus(percentUsed);
        return { ...budget, actual, percentUsed, difference, status };
      })
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [selectedMonth, state.budgets, state.transactions]);

  const summary = useMemo(() => {
    const totalBudget = rows.reduce((sum, item) => sum + item.amount, 0);
    const totalActual = rows.reduce((sum, item) => sum + item.actual, 0);
    const overspentCount = rows.filter((item) => item.percentUsed > 100).length;
    return {
      totalBudget,
      totalActual,
      remaining: totalBudget - totalActual,
      overspentCount
    };
  }, [rows]);

  function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this budget row?");
    if (confirmed) {
      deleteBudget(id);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Budget planner"
        title="Budget Planner"
        description="Set budgets category by category, compare against actual spend, and watch overspending early."
        actions={
          <>
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
            />
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add budget
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Budgeted" value={formatCurrency(summary.totalBudget, state.userSettings.currency)} detail={formatMonthLabel(selectedMonth)} tone="gold" />
        <SummaryCard title="Actual spend" value={formatCurrency(summary.totalActual, state.userSettings.currency)} detail="Expense entries for this month" tone="red" />
        <SummaryCard title="Remaining" value={formatCurrency(summary.remaining, state.userSettings.currency)} detail="Budget minus actual" tone={summary.remaining >= 0 ? "green" : "red"} />
        <SummaryCard title="Overspent categories" value={String(summary.overspentCount)} detail="Need attention" tone={summary.overspentCount > 0 ? "red" : "green"} />
      </section>

      <section className="mt-6 grid gap-4">
        {rows.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-lg font-semibold">No budgets for {formatMonthLabel(selectedMonth)}</p>
            <p className="mt-2 text-sm text-muted">Add one to start tracking your monthly categories.</p>
          </Card>
        ) : null}

        {rows.map((item) => (
          <Card key={item.id} className="p-5 md:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg font-semibold">{item.category}</p>
                  <Badge tone={item.status.tone}>{item.status.label}</Badge>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p>Budgeted</p>
                    <p className="mt-1 font-semibold text-white">{formatCurrency(item.amount, state.userSettings.currency)}</p>
                  </div>
                  <div>
                    <p>Actual</p>
                    <p className="mt-1 font-semibold text-white">{formatCurrency(item.actual, state.userSettings.currency)}</p>
                  </div>
                  <div>
                    <p>Difference</p>
                    <p className={`mt-1 font-semibold ${item.difference >= 0 ? "text-success" : "text-danger"}`}>
                      {formatCurrency(item.difference, state.userSettings.currency)}
                    </p>
                  </div>
                  <div>
                    <p>Used</p>
                    <p className="mt-1 font-semibold text-white">{formatPercent(item.percentUsed)}</p>
                  </div>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/8">
                  <div
                    className={`h-full rounded-full ${
                      item.percentUsed > 100 ? "bg-danger" : item.percentUsed > 90 ? "bg-primary" : "bg-success"
                    }`}
                    style={{ width: `${Math.min(item.percentUsed, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row xl:flex-col xl:items-stretch">
                <Button variant="secondary" className="gap-2" onClick={() => setEditingItem(item)}>
                  <PencilLine className="h-4 w-4" />
                  Edit
                </Button>
                <Button variant="secondary" className="gap-2 text-danger hover:border-danger/30" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add budget" description="Create a new budget row for the selected month.">
        <BudgetForm
          categoryOptions={categories}
          submitLabel="Save budget"
          onCancel={() => setCreateOpen(false)}
          onSubmit={async (input) => {
            const saved = await addBudget(input);
            if (saved) {
              setSelectedMonth(input.month);
              setCreateOpen(false);
            }
            return saved;
          }}
        />
      </Modal>

      <Modal open={Boolean(editingItem)} onClose={() => setEditingItem(null)} title="Edit budget" description="Update category, amount, or month.">
        {editingItem ? (
          <BudgetForm
            initialValue={editingItem}
            categoryOptions={categories}
            submitLabel="Update budget"
            onCancel={() => setEditingItem(null)}
            onSubmit={async (input) => {
              const saved = await updateBudget(editingItem.id, input);
              if (saved) setEditingItem(null);
              return saved;
            }}
          />
        ) : null}
      </Modal>
    </AppShell>
  );
}
