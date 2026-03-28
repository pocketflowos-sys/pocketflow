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
import { PdfExportButton } from "@/components/ui/pdf-export-button";
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
        const actual = state.transactions.filter((item) => item.type === "expense" && item.category === budget.category && getMonthKey(item.date) === selectedMonth).reduce((sum, item) => sum + item.amount, 0);
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
    return { totalBudget, totalActual, remaining: totalBudget - totalActual, overspentCount };
  }, [rows]);

  function handleDelete(id: string) {
    if (window.confirm("Delete this budget row?")) deleteBudget(id);
  }

  return (
    <AppShell>
      <PageHeader compact eyebrow="Budget planner" title="Budgets" description="Track category budgets without crowding the mobile screen." actions={<><PdfExportButton /><input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" /><Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Add</Button></>} />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard title="Budgeted" value={formatCurrency(summary.totalBudget, state.userSettings.currency)} detail={formatMonthLabel(selectedMonth)} tone="gold" />
        <SummaryCard title="Spent" value={formatCurrency(summary.totalActual, state.userSettings.currency)} detail="Expense entries" tone="red" />
        <SummaryCard title="Remaining" value={formatCurrency(summary.remaining, state.userSettings.currency)} detail="Budget minus spend" tone={summary.remaining >= 0 ? "green" : "red"} />
        <SummaryCard title="Overspent" value={String(summary.overspentCount)} detail="Need attention" tone={summary.overspentCount > 0 ? "red" : "green"} />
      </section>

      <section className="mt-4 grid gap-3">
        {rows.length === 0 ? <Card className="p-8 text-center"><p className="text-lg font-semibold">No budgets for {formatMonthLabel(selectedMonth)}</p><p className="mt-2 text-sm text-muted">Add one to start tracking your monthly categories.</p></Card> : null}
        {rows.map((item) => (
          <div key={item.id} className="contents">
            <Card key={`${item.id}-mobile`} className="p-4 md:hidden">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2"><p className="font-semibold">{item.category}</p><Badge tone={item.status.tone}>{item.status.label}</Badge></div>
                  <p className="mt-1 text-sm text-muted">{formatCurrency(item.actual, state.userSettings.currency)} of {formatCurrency(item.amount, state.userSettings.currency)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold">{formatPercent(item.percentUsed)}</p>
                  <p className={`mt-1 text-sm ${item.difference >= 0 ? "text-success" : "text-danger"}`}>{formatCurrency(item.difference, state.userSettings.currency)}</p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8"><div className={`${item.percentUsed > 100 ? "bg-danger" : item.percentUsed > 90 ? "bg-primary" : "bg-success"} h-full rounded-full`} style={{ width: `${Math.min(item.percentUsed, 100)}%` }} /></div>
              <div className="mt-4 flex gap-2"><Button variant="secondary" className="flex-1 gap-2" onClick={() => setEditingItem(item)}><PencilLine className="h-4 w-4" />Edit</Button><Button variant="secondary" className="flex-1 gap-2 text-danger hover:border-danger/30" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" />Delete</Button></div>
            </Card>
            <Card key={`${item.id}-desktop`} className="hidden p-5 md:block">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3"><p className="text-lg font-semibold">{item.category}</p><Badge tone={item.status.tone}>{item.status.label}</Badge></div>
                  <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-2 lg:grid-cols-4">
                    <div><p>Budgeted</p><p className="mt-1 font-semibold text-white">{formatCurrency(item.amount, state.userSettings.currency)}</p></div>
                    <div><p>Actual</p><p className="mt-1 font-semibold text-white">{formatCurrency(item.actual, state.userSettings.currency)}</p></div>
                    <div><p>Difference</p><p className={`mt-1 font-semibold ${item.difference >= 0 ? "text-success" : "text-danger"}`}>{formatCurrency(item.difference, state.userSettings.currency)}</p></div>
                    <div><p>Used</p><p className="mt-1 font-semibold text-white">{formatPercent(item.percentUsed)}</p></div>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/8"><div className={`${item.percentUsed > 100 ? "bg-danger" : item.percentUsed > 90 ? "bg-primary" : "bg-success"} h-full rounded-full`} style={{ width: `${Math.min(item.percentUsed, 100)}%` }} /></div>
                </div>
                <div className="flex gap-2"><Button variant="secondary" className="gap-2" onClick={() => setEditingItem(item)}><PencilLine className="h-4 w-4" />Edit</Button><Button variant="secondary" className="gap-2 text-danger hover:border-danger/30" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" />Delete</Button></div>
              </div>
            </Card>
          </div>
        ))}
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add budget" description="Create a new budget row for the selected month.">
        <BudgetForm categoryOptions={categories} submitLabel="Save budget" onCancel={() => setCreateOpen(false)} onSubmit={async (input) => { const saved = await addBudget(input); if (saved) { setSelectedMonth(input.month); setCreateOpen(false); } return saved; }} />
      </Modal>

      <Modal open={Boolean(editingItem)} onClose={() => setEditingItem(null)} title="Edit budget" description="Update category, amount, or month.">
        {editingItem ? <BudgetForm initialValue={editingItem} categoryOptions={categories} submitLabel="Update budget" onCancel={() => setEditingItem(null)} onSubmit={async (input) => { const saved = await updateBudget(editingItem.id, input); if (saved) setEditingItem(null); return saved; }} /> : null}
      </Modal>
    </AppShell>
  );
}
