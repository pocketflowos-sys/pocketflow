"use client";

import { useMemo, useState } from "react";
import { Download, Landmark, PencilLine, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { InvestmentForm } from "@/components/investments/investment-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldShell, InputField, SelectField } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SummaryCard } from "@/components/ui/summary-card";
import { downloadCsv, getInvestmentGain, getInvestmentReturnPercent } from "@/lib/finance";
import { formatCompactDate, formatCurrency } from "@/lib/formatters";
import { usePocketFlow, usePocketFlowOptions } from "@/lib/pocketflow-store";
import type { Investment } from "@/lib/types";

const defaultFilters = {
  search: "",
  type: "all",
  platform: "all"
};

export function InvestmentsPage() {
  const { state, addInvestment, updateInvestment, deleteInvestment } = usePocketFlow();
  const { investmentPlatforms, investmentTypes } = usePocketFlowOptions();
  const [filters, setFilters] = useState(defaultFilters);
  const [editingItem, setEditingItem] = useState<Investment | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const rows = useMemo(() => {
    return [...state.investments]
      .map((item) => {
        const gain = getInvestmentGain(item.currentValue, item.investedAmount, item.withdrawnAmount);
        const returnPercent = getInvestmentReturnPercent(item.currentValue, item.investedAmount, item.withdrawnAmount);
        return { ...item, gain, returnPercent };
      })
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

  function exportRows() {
    downloadCsv(
      "pocketflow-investments.csv",
      ["Date", "Type", "Platform", "Invested", "Current Value", "Withdrawn", "Gain/Loss", "Return %", "Notes"],
      rows.map((item) => [
        item.date,
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
    const confirmed = window.confirm("Delete this investment entry?");
    if (confirmed) deleteInvestment(id);
  }

  const allocation = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((item) => {
      map.set(item.investmentType, (map.get(item.investmentType) ?? 0) + item.currentValue);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Phase 4"
        title="Investments"
        description="Track portfolio value, returns, withdrawn money, and allocation across different investment types."
        actions={
          <>
            <Button variant="secondary" onClick={exportRows} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add investment
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total invested" value={formatCurrency(summary.totalInvested, state.userSettings.currency)} detail="Capital deployed" tone="gold" icon={<Landmark className="h-5 w-5" />} />
        <SummaryCard title="Current value" value={formatCurrency(summary.totalCurrentValue, state.userSettings.currency)} detail="Live holdings value" tone="green" />
        <SummaryCard title="Withdrawn" value={formatCurrency(summary.totalWithdrawn, state.userSettings.currency)} detail="Money already taken out" />
        <SummaryCard title="Gain / loss" value={formatCurrency(summary.gainLoss, state.userSettings.currency)} detail="Across filtered holdings" tone={summary.gainLoss >= 0 ? "green" : "red"} />
      </section>

      <Card className="mt-6 p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <FieldShell label="Search">
            <InputField value={filters.search} placeholder="Mutual fund, broker, note" onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))} />
          </FieldShell>
          <FieldShell label="Investment type">
            <SelectField value={filters.type} onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}>
              <option value="all">All</option>
              {investmentTypes.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </SelectField>
          </FieldShell>
          <FieldShell label="Platform">
            <SelectField value={filters.platform} onChange={(event) => setFilters((prev) => ({ ...prev, platform: event.target.value }))}>
              <option value="all">All</option>
              {investmentPlatforms.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </SelectField>
          </FieldShell>
        </div>
      </Card>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4">
          {rows.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-lg font-semibold">No investments found</p>
              <p className="mt-2 text-sm text-muted">Try another filter or add a new holding.</p>
            </Card>
          ) : null}

          {rows.map((item) => (
            <Card key={item.id} className="p-5 md:p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold">{item.investmentType}</p>
                    <Badge tone="neutral">{item.platform}</Badge>
                    <Badge tone={item.gain >= 0 ? "green" : "red"}>{item.returnPercent.toFixed(1)}%</Badge>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p>Invested</p>
                      <p className="mt-1 font-semibold text-white">{formatCurrency(item.investedAmount, state.userSettings.currency)}</p>
                    </div>
                    <div>
                      <p>Current value</p>
                      <p className="mt-1 font-semibold text-white">{formatCurrency(item.currentValue, state.userSettings.currency)}</p>
                    </div>
                    <div>
                      <p>Withdrawn</p>
                      <p className="mt-1 font-semibold text-white">{formatCurrency(item.withdrawnAmount, state.userSettings.currency)}</p>
                    </div>
                    <div>
                      <p>Gain / loss</p>
                      <p className={`mt-1 font-semibold ${item.gain >= 0 ? "text-success" : "text-danger"}`}>{formatCurrency(item.gain, state.userSettings.currency)}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-muted">
                    Added {formatCompactDate(item.date)}
                    {item.notes ? ` • ${item.notes}` : ""}
                  </p>
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
        </div>

        <Card className="p-5 md:p-6">
          <p className="text-xl font-semibold">Allocation snapshot</p>
          <p className="mt-1 text-sm text-muted">Current value split by investment type.</p>
          <div className="mt-5 space-y-4">
            {allocation.map(([name, value]) => {
              const share = summary.totalCurrentValue > 0 ? (value / summary.totalCurrentValue) * 100 : 0;
              return (
                <div key={name}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>{name}</span>
                    <span className="text-muted">{share.toFixed(0)}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
                  </div>
                  <p className="mt-2 text-sm text-muted">{formatCurrency(value, state.userSettings.currency)}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add investment" description="Save a new portfolio entry.">
        <InvestmentForm
          investmentTypeOptions={investmentTypes}
          platformOptions={investmentPlatforms}
          submitLabel="Save investment"
          onCancel={() => setCreateOpen(false)}
          onSubmit={(input) => {
            addInvestment(input);
            setCreateOpen(false);
          }}
        />
      </Modal>

      <Modal open={Boolean(editingItem)} onClose={() => setEditingItem(null)} title="Edit investment" description="Update value, broker, or notes.">
        {editingItem ? (
          <InvestmentForm
            initialValue={editingItem}
            investmentTypeOptions={investmentTypes}
            platformOptions={investmentPlatforms}
            submitLabel="Update investment"
            onCancel={() => setEditingItem(null)}
            onSubmit={(input) => {
              updateInvestment(editingItem.id, input);
              setEditingItem(null);
            }}
          />
        ) : null}
      </Modal>
    </AppShell>
  );
}
