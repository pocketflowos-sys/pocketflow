"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FolderKanban, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { QuickAdd } from "@/components/dashboard/quick-add";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SummaryCard } from "@/components/ui/summary-card";
import { formatCurrency } from "@/lib/formatters";
import { usePocketFlow } from "@/lib/pocketflow-store";

const groups = ["income", "expense", "investment", "asset", "loan"] as const;

export function CategoriesPage() {
  const { state } = usePocketFlow();
  const searchParams = useSearchParams();
  const initialGroup = searchParams.get("group");
  const initialCategory = searchParams.get("category");
  const [group, setGroup] = useState<(typeof groups)[number]>((groups as readonly string[]).includes(initialGroup ?? "") ? (initialGroup as any) : "expense");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory ?? "");
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const groupedData = useMemo(() => {
    if (group === "income" || group === "expense") {
      const rows = state.transactions.filter((item) => item.type === group);
      const categories = Array.from(new Set(rows.map((item) => item.category))).sort();
      const summary = categories.map((category) => ({
        category,
        amount: rows.filter((item) => item.category === category).reduce((sum, item) => sum + item.amount, 0),
        count: rows.filter((item) => item.category === category).length
      }));
      const selectedRows = selectedCategory ? rows.filter((item) => item.category === selectedCategory) : rows;
      return { categories, summary, selectedRows };
    }

    if (group === "investment") {
      const rows = state.investments;
      const categories = Array.from(new Set(rows.map((item) => item.investmentType))).sort();
      const summary = categories.map((category) => ({
        category,
        amount: rows.filter((item) => item.investmentType === category).reduce((sum, item) => sum + item.currentValue, 0),
        count: rows.filter((item) => item.investmentType === category).length
      }));
      const selectedRows = selectedCategory ? rows.filter((item) => item.investmentType === selectedCategory) : rows;
      return { categories, summary, selectedRows };
    }

    if (group === "asset") {
      const rows = state.assets;
      const categories = Array.from(new Set(rows.map((item) => item.assetCategory))).sort();
      const summary = categories.map((category) => ({
        category,
        amount: rows.filter((item) => item.assetCategory === category).reduce((sum, item) => sum + item.currentValue, 0),
        count: rows.filter((item) => item.assetCategory === category).length
      }));
      const selectedRows = selectedCategory ? rows.filter((item) => item.assetCategory === selectedCategory) : rows;
      return { categories, summary, selectedRows };
    }

    const rows = state.loans;
    const categories = Array.from(new Set(rows.map((item) => item.lender || "Other lender"))).sort();
    const summary = categories.map((category) => ({
      category,
      amount: rows.filter((item) => (item.lender || "Other lender") === category).reduce((sum, item) => sum + item.outstandingAmount, 0),
      count: rows.filter((item) => (item.lender || "Other lender") === category).length
    }));
    const selectedRows = selectedCategory ? rows.filter((item) => (item.lender || "Other lender") === selectedCategory) : rows;
    return { categories, summary, selectedRows };
  }, [group, selectedCategory, state]);

  const totalAmount = groupedData.summary.reduce((sum, item) => sum + item.amount, 0);

  return (
    <AppShell>
      <PageHeader compact eyebrow="Category page" title="Categories" description="Pick a category and see related data and summary in one focused view." actions={<Button onClick={() => setQuickAddOpen(true)} className="w-full gap-2 sm:w-auto"><Plus className="h-4 w-4" />Quick add</Button>} />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Category lines" value={String(groupedData.categories.length)} detail="Visible in this group" icon={<FolderKanban className="h-5 w-5" />} className="min-h-[132px] p-4 sm:min-h-[148px] md:p-5" />
        <SummaryCard title="Total amount" value={formatCurrency(totalAmount, state.userSettings.currency)} detail="Sum of current group" tone="gold" className="min-h-[132px] p-4 sm:min-h-[148px] md:p-5" />
        <SummaryCard title="Selected group" value={group.toUpperCase()} detail="Switch group below" className="min-h-[132px] p-4 sm:min-h-[148px] md:p-5" />
        <SummaryCard title="Selected category" value={selectedCategory || "All"} detail="Tap a chip to filter" className="min-h-[132px] p-4 sm:min-h-[148px] md:p-5" />
      </section>

      <Card className="mt-4 p-4 md:p-6">
        <div className="flex flex-wrap gap-2">
          {groups.map((item) => (
            <button key={item} onClick={() => { setGroup(item); setSelectedCategory(""); }} className={`rounded-full px-4 py-2 text-sm transition ${group === item ? "bg-primary text-black" : "border border-white/10 bg-white/[0.03] text-white"}`}>{item}</button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setSelectedCategory("")} className={`rounded-full px-4 py-2 text-sm transition ${selectedCategory === "" ? "bg-primary text-black" : "border border-white/10 bg-white/[0.03] text-white"}`}>All</button>
          {groupedData.categories.map((category) => (
            <button key={category} onClick={() => setSelectedCategory(category)} className={`rounded-full px-4 py-2 text-sm transition ${selectedCategory === category ? "bg-primary text-black" : "border border-white/10 bg-white/[0.03] text-white"}`}>{category}</button>
          ))}
        </div>
      </Card>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {groupedData.summary.map((item) => {
            const share = totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0;
            const active = selectedCategory === item.category;
            return (
              <button key={item.category} onClick={() => setSelectedCategory(item.category)} className="w-full text-left">
                <Card className={`h-full p-4 transition ${active ? "border-primary/30 bg-primary/10" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{item.category}</p>
                      <p className="mt-1 text-sm text-muted">{item.count} item{item.count === 1 ? "" : "s"}</p>
                    </div>
                    <p className="text-xs text-muted">{share.toFixed(0)}%</p>
                  </div>
                  <p className="mt-4 text-xl font-semibold tabular-nums">{formatCurrency(item.amount, state.userSettings.currency)}</p>
                  <p className="mt-2 text-sm text-muted">Tap to focus related data</p>
                </Card>
              </button>
            );
          })}
      </section>

      <Card className="mt-4 p-4 md:p-6">
        <p className="text-lg font-semibold">Related data</p>
        <p className="mt-1 text-sm text-muted">This list updates when you change the group or category above.</p>
        <div className="mt-4 space-y-3">
          {groupedData.selectedRows.length === 0 ? <p className="text-sm text-muted">No data found for this selection.</p> : null}
          {groupedData.selectedRows.map((item: any) => (
            <div key={item.id} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.title || item.assetName || item.loanName || item.cardName || item.person || item.investmentType}</p>
                  <p className="mt-1 text-sm text-muted">{item.date || item.startDate || item.billingDate || item.dueDate || item.platform || item.lender || item.assetCategory || item.category}</p>
                </div>
                <p className="text-lg font-semibold tabular-nums">{formatCurrency(item.amount ?? item.currentValue ?? item.outstandingAmount ?? item.currentBalance ?? item.investedAmount ?? 0, state.userSettings.currency)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} title="Quick add from category page" description="The selected group and category are pre-filled when possible.">
        <QuickAdd
          initialTab={group === "investment" ? "Investment" : group === "asset" ? "Asset" : "Transaction"}
          preset={{
            transactionType: group === "income" ? "income" : "expense",
            category: selectedCategory || undefined,
            investmentType: group === "investment" ? selectedCategory || undefined : undefined,
            assetCategory: group === "asset" ? selectedCategory || undefined : undefined
          }}
          onSuccess={() => setQuickAddOpen(false)}
        />
      </Modal>
    </AppShell>
  );
}
