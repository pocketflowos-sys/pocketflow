"use client";

import { useMemo, useState } from "react";
import { Download, Landmark, PencilLine, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { InvestmentForm } from "@/components/investments/investment-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterPanel } from "@/components/ui/filter-panel";
import { FieldShell, InputField, SelectField } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { PdfExportButton } from "@/components/ui/pdf-export-button";
import { SummaryCard } from "@/components/ui/summary-card";
import { downloadCsv, getInvestmentGain, getInvestmentReturnPercent } from "@/lib/finance";
import { formatCompactDate, formatCsvDate, formatCurrency } from "@/lib/formatters";
import { usePocketFlow, usePocketFlowOptions } from "@/lib/pocketflow-store";
import type { Investment } from "@/lib/types";

const defaultFilters = { search: "", type: "all", platform: "all" };

export function InvestmentsPage() {
  const { state, addInvestment, updateInvestment, deleteInvestment } = usePocketFlow();
  const { investmentPlatforms, investmentTypes } = usePocketFlowOptions();
  const [filters, setFilters] = useState(defaultFilters);
  const [editingItem, setEditingItem] = useState<Investment | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const rows = useMemo(() => {
    return [...state.investments]
      .map((item) => ({
        ...item,
        gain: getInvestmentGain(item.currentValue, item.investedAmount, item.withdrawnAmount),
        returnPercent: getInvestmentReturnPercent(item.currentValue, item.investedAmount, item.withdrawnAmount)
      }))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .filter((item) => {
        const searchTarget = `${item.investmentType} ${item.platform} ${item.notes ?? ""}`.toLowerCase();
        const matchesSearch = filters.search ? searchTarget.includes(filters.search.toLowerCase()) : true;
        const matchesType = filters.type === "all" ? true : item.investmentType === filters.type;
        const matchesPlatform = filters.platform === "all" ? true : item.platform === filters.platform;
        return matchesSearch && matchesType && matchesPlatform;
      });
  }, [filters, state.investments]);

  const summary = useMemo(() => {
    const totalInvested = rows.reduce((sum, item) => sum + item.investedAmount, 0);
    const totalCurrentValue = rows.reduce((sum, item) => sum + item.currentValue, 0);
    const totalWithdrawn = rows.reduce((sum, item) => sum + item.withdrawnAmount, 0);
    const gainLoss = rows.reduce((sum, item) => sum + item.gain, 0);
    return { totalInvested, totalCurrentValue, totalWithdrawn, gainLoss };
  }, [rows]);

  const allocation = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((item) => map.set(item.investmentType, (map.get(item.investmentType) ?? 0) + item.currentValue));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const hasActiveFilters = Boolean(filters.search || filters.type !== "all" || filters.platform !== "all");

  function resetFilters() {
    setFilters(defaultFilters);
  }

  function exportRows() {
    downloadCsv(
      "pocketflow-investments.csv",
      ["Date", "Type", "Platform", "Invested", "Current Value", "Withdrawn", "Gain/Loss", "Return %", "Notes"],
      rows.map((item) => [
        formatCsvDate(item.date),
        item.investmentType,
        item.platform,
        item.investedAmount,
        item.currentValue,
        item.withdrawnAmount,
        item.gain,
        item.returnPercent.toFixed(2),
        item.notes ?? ""
      ])
    );
  }

  function handleDelete(id: string) {
    if (window.confirm("Delete this investment entry?")) deleteInvestment(id);
  }

  return (
    <AppShell>
      <PageHeader
        compact
        eyebrow="Portfolio"
        title="Investments"
        description="Keep holdings readable and light on mobile."
        actions={
          <>
            <PdfExportButton />
            <Button variant="secondary" className="gap-2" onClick={exportRows}>
              <Download className="h-4 w-4" />CSV
            </Button>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />Add
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard title="Invested" value={formatCurrency(summary.totalInvested, state.userSettings.currency)} detail="Capital deployed" tone="gold" icon={<Landmark className="h-5 w-5" />} />
        <SummaryCard title="Current value" value={formatCurrency(summary.totalCurrentValue, state.userSettings.currency)} detail="Live holdings" tone="green" />
        <SummaryCard title="Withdrawn" value={formatCurrency(summary.totalWithdrawn, state.userSettings.currency)} detail="Already taken out" />
        <SummaryCard title="Gain / loss" value={formatCurrency(summary.gainLoss, state.userSettings.currency)} detail="Across filtered holdings" tone={summary.gainLoss >= 0 ? "green" : "red"} />
      </section>

      <FilterPanel
        title="Investment filters"
        hasActiveFilters={hasActiveFilters}
        onClear={resetFilters}
        summary={[
          filters.search && `Search: ${filters.search}`,
          filters.type !== "all" && `Type: ${filters.type}`,
          filters.platform !== "all" && `Platform: ${filters.platform}`
        ]}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <FieldShell label="Search" className="col-span-2 md:col-span-1"><InputField value={filters.search} placeholder="Mutual fund, broker, note" onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))} /></FieldShell>
          <FieldShell label="Investment type"><SelectField value={filters.type} onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}><option value="all">All</option>{investmentTypes.map((item) => <option key={item} value={item}>{item}</option>)}</SelectField></FieldShell>
          <FieldShell label="Platform"><SelectField value={filters.platform} onChange={(event) => setFilters((prev) => ({ ...prev, platform: event.target.value }))}><option value="all">All</option>{investmentPlatforms.map((item) => <option key={item} value={item}>{item}</option>)}</SelectField></FieldShell>
        </div>
        {hasActiveFilters ? <div className="mt-4 hidden md:block"><Button variant="ghost" onClick={resetFilters}>Clear filters</Button></div> : null}
      </FilterPanel>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-3">
          {rows.length === 0 ? <Card className="p-8 text-center"><p className="text-lg font-semibold">No investments found</p><p className="mt-2 text-sm text-muted">Try another filter or add a new holding.</p></Card> : null}
          {rows.map((item) => (
            <div key={item.id}>
              <Card className="p-4 md:hidden">
                <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><p className="font-semibold">{item.investmentType}</p><Badge tone="neutral">{item.platform}</Badge></div><p className="mt-1 text-sm text-muted">Added {formatCompactDate(item.date)}</p></div><Badge tone={item.gain >= 0 ? "green" : "red"}>{item.returnPercent.toFixed(1)}%</Badge></div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><p className="text-muted">Current value</p><p className="mt-1 text-xl font-semibold tabular-nums">{formatCurrency(item.currentValue, state.userSettings.currency)}</p></div><div className="text-right"><p className="text-muted">Gain / loss</p><p className={`mt-1 text-xl font-semibold tabular-nums ${item.gain >= 0 ? "text-success" : "text-danger"}`}>{formatCurrency(item.gain, state.userSettings.currency)}</p></div></div>
                <div className="mt-4 flex gap-2"><Button variant="secondary" className="flex-1 gap-2" onClick={() => setEditingItem(item)}><PencilLine className="h-4 w-4" />Edit</Button><Button variant="secondary" className="flex-1 gap-2 text-danger hover:border-danger/30" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" />Delete</Button></div>
              </Card>
              <Card className="hidden p-5 md:block">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-lg font-semibold">{item.investmentType}</p><Badge tone="neutral">{item.platform}</Badge><Badge tone={item.gain >= 0 ? "green" : "red"}>{item.returnPercent.toFixed(1)}%</Badge></div><div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-2 lg:grid-cols-4"><div><p>Invested</p><p className="mt-1 font-semibold tabular-nums text-white">{formatCurrency(item.investedAmount, state.userSettings.currency)}</p></div><div><p>Current value</p><p className="mt-1 font-semibold tabular-nums text-white">{formatCurrency(item.currentValue, state.userSettings.currency)}</p></div><div><p>Withdrawn</p><p className="mt-1 font-semibold tabular-nums text-white">{formatCurrency(item.withdrawnAmount, state.userSettings.currency)}</p></div><div><p>Gain / loss</p><p className={`mt-1 font-semibold tabular-nums ${item.gain >= 0 ? "text-success" : "text-danger"}`}>{formatCurrency(item.gain, state.userSettings.currency)}</p></div></div><p className="mt-4 text-sm text-muted">Added {formatCompactDate(item.date)}{item.notes ? ` • ${item.notes}` : ""}</p></div><div className="flex flex-col gap-2 sm:flex-row xl:flex-col xl:items-stretch"><Button variant="secondary" className="gap-2" onClick={() => setEditingItem(item)}><PencilLine className="h-4 w-4" />Edit</Button><Button variant="secondary" className="gap-2 text-danger hover:border-danger/30" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" />Delete</Button></div></div>
              </Card>
            </div>
          ))}
        </div>

        <Card className="p-5 md:p-6">
          <p className="text-xl font-semibold">Allocation snapshot</p>
          <p className="mt-1 text-sm text-muted">Current value split by investment type.</p>
          <div className="mt-5 space-y-4">
            {allocation.map(([name, value]) => {
              const share = summary.totalCurrentValue > 0 ? (value / summary.totalCurrentValue) * 100 : 0;
              return (
                <div key={name}>
                  <div className="mb-2 flex items-center justify-between text-sm"><span>{name}</span><span className="tabular-nums text-muted">{share.toFixed(0)}%</span></div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} /></div>
                  <p className="mt-2 text-sm text-muted tabular-nums">{formatCurrency(value, state.userSettings.currency)}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add investment" description="Save a new portfolio entry.">
        <InvestmentForm investmentTypeOptions={investmentTypes} platformOptions={investmentPlatforms} submitLabel="Save investment" onCancel={() => setCreateOpen(false)} onSubmit={async (input) => { const saved = await addInvestment(input); if (saved) setCreateOpen(false); return saved; }} />
      </Modal>

      <Modal open={Boolean(editingItem)} onClose={() => setEditingItem(null)} title="Edit investment" description="Update value, broker, or notes.">
        {editingItem ? <InvestmentForm initialValue={editingItem} investmentTypeOptions={investmentTypes} platformOptions={investmentPlatforms} submitLabel="Update investment" onCancel={() => setEditingItem(null)} onSubmit={async (input) => { const saved = await updateInvestment(editingItem.id, input); if (saved) setEditingItem(null); return saved; }} /> : null}
      </Modal>
    </AppShell>
  );
}
