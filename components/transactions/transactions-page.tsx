"use client";

import { useMemo, useState } from "react";
import { Download, Paperclip, PencilLine, Plus, Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterPanel } from "@/components/ui/filter-panel";
import { ComboField, FieldShell, InputField } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { PdfExportButton } from "@/components/ui/pdf-export-button";
import { SummaryCard } from "@/components/ui/summary-card";
import { downloadCsv } from "@/lib/finance";
import { formatCompactDate, formatCsvDate, formatCurrency } from "@/lib/formatters";
import { usePocketFlow, usePocketFlowOptions } from "@/lib/pocketflow-store";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { createTransactionProofSignedUrl } from "@/lib/transaction-proofs";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

type TransactionFilters = {
  search: string;
  type: "all" | "income" | "expense";
  category: string;
  paymentMethod: string;
  startDate: string;
  endDate: string;
};

const defaultFilters: TransactionFilters = {
  search: "",
  type: "all",
  category: "all",
  paymentMethod: "all",
  startDate: "",
  endDate: ""
};

const typeFilterOptions: Array<{ value: "all" | "income" | "expense"; label: string }> = [
  { value: "all", label: "All" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" }
];

function normalizeFilterValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "all") return "all";
  return trimmed;
}

export function TransactionsPage() {
  const { state, addTransaction, updateTransaction, deleteTransaction } = usePocketFlow();
  const { categories, paymentMethods } = usePocketFlowOptions();
  const [filters, setFilters] = useState<TransactionFilters>(defaultFilters);
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);

  const categoryOptions = useMemo(() => {
    const values = new Set<string>(categories);
    state.transactions.forEach((item) => values.add(item.category));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [categories, state.transactions]);

  const paymentMethodOptions = useMemo(() => {
    const values = new Set<string>(paymentMethods);
    state.transactions.forEach((item) => values.add(item.paymentMethod));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [paymentMethods, state.transactions]);

  const filteredTransactions = useMemo(() => {
    return [...state.transactions]
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .filter((item) => {
        const searchTarget = `${item.title} ${item.category} ${item.notes ?? ""} ${item.proofFileName ?? ""}`.toLowerCase();
        const matchesSearch = filters.search ? searchTarget.includes(filters.search.toLowerCase()) : true;
        const matchesType = filters.type === "all" ? true : item.type === filters.type;
        const matchesCategory = filters.category === "all" ? true : item.category === filters.category;
        const matchesPayment = filters.paymentMethod === "all" ? true : item.paymentMethod === filters.paymentMethod;
        const matchesStart = filters.startDate ? item.date >= filters.startDate : true;
        const matchesEnd = filters.endDate ? item.date <= filters.endDate : true;
        return matchesSearch && matchesType && matchesCategory && matchesPayment && matchesStart && matchesEnd;
      });
  }, [filters, state.transactions]);

  const visibleTransactions = filteredTransactions.slice(0, visibleCount);

  const summary = useMemo(() => {
    const income = filteredTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
    const expense = filteredTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
    return { income, expense, balance: income - expense, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.type !== "all" ||
      filters.category !== "all" ||
      filters.paymentMethod !== "all" ||
      filters.startDate ||
      filters.endDate
  );

  function resetFilters() {
    setVisibleCount(8);
    setFilters(defaultFilters);
  }

  function exportTransactions() {
    downloadCsv(
      "pocketflow-transactions.csv",
      ["Date", "Type", "Title", "Category", "Amount", "Payment Method", "Notes"],
      filteredTransactions.map((item) => [
        formatCsvDate(item.date),
        item.type,
        item.title,
        item.category,
        item.amount,
        item.paymentMethod,
        item.notes ?? ""
      ])
    );
  }

  function handleDelete(id: string) {
    if (window.confirm("Delete this transaction from PocketFlow?")) deleteTransaction(id);
  }

  async function openProof(item: Transaction) {
    if (!item.proofStoragePath) return;
    try {
      const supabase = createBrowserSupabaseClient();
      const signedUrl = await createTransactionProofSignedUrl(supabase, item.proofStoragePath);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch {
      window.alert("Could not open the saved proof file.");
    }
  }

  return (
    <AppShell>
      <div className="min-w-0 overflow-x-hidden">
        <PageHeader
          compact
          eyebrow="Money movement"
          title="Transactions"
          description="Search, export, or edit your saved entries."
          actions={
            <div className="grid w-full min-w-0 grid-cols-3 gap-2 md:w-auto md:flex md:flex-wrap">
              <PdfExportButton className="h-11 w-full min-w-0 px-3 md:w-auto md:px-5" />
              <Button variant="secondary" onClick={exportTransactions} className="h-11 w-full min-w-0 gap-2 px-3 md:w-auto md:px-5"><Download className="h-4 w-4" />CSV</Button>
              <Button onClick={() => setCreateOpen(true)} className="h-11 w-full min-w-0 gap-2 px-3 md:w-auto md:px-5"><Plus className="h-4 w-4" />Add</Button>
            </div>
          }
        />

        <section className="grid grid-cols-2 gap-2.5 md:gap-3 xl:grid-cols-4">
          <SummaryCard className="min-h-[116px] md:min-h-0" title="Income" value={formatCurrency(summary.income, state.userSettings.currency)} detail="Filtered" tone="green" />
          <SummaryCard className="min-h-[116px] md:min-h-0" title="Expenses" value={formatCurrency(summary.expense, state.userSettings.currency)} detail="Filtered" tone="red" />
          <SummaryCard className="min-h-[116px] md:min-h-0" title="Net" value={formatCurrency(summary.balance, state.userSettings.currency)} detail="Income minus expense" tone={summary.balance >= 0 ? "green" : "red"} />
          <SummaryCard className="min-h-[116px] md:min-h-0" title="Entries" value={String(summary.count)} detail="Matching filters" />
        </section>

        <FilterPanel
          title="Transaction filters"
          hasActiveFilters={hasActiveFilters}
          onClear={resetFilters}
          summary={[
            filters.search && `Search: ${filters.search}`,
            filters.type !== "all" && `Type: ${filters.type}`,
            filters.category !== "all" && `Category: ${filters.category}`,
            filters.paymentMethod !== "all" && `Payment: ${filters.paymentMethod}`,
            filters.startDate && `From: ${formatCompactDate(filters.startDate)}`,
            filters.endDate && `To: ${formatCompactDate(filters.endDate)}`
          ]}
        >
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
            <FieldShell label="Search" className="col-span-2 xl:col-span-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <InputField
                  className="pl-11"
                  value={filters.search}
                  placeholder="Search title, category, notes"
                  onChange={(event) => {
                    setVisibleCount(8);
                    setFilters((prev) => ({ ...prev, search: event.target.value }));
                  }}
                />
              </div>
            </FieldShell>

            <FieldShell label="Type" className="col-span-2 xl:col-span-1">
              <div className="grid grid-cols-3 gap-2">
                {typeFilterOptions.map((option) => {
                  const active = filters.type === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setVisibleCount(8);
                        setFilters((prev) => ({ ...prev, type: option.value }));
                      }}
                      className={cn(
                        "h-11 rounded-2xl border px-2 text-sm font-medium transition",
                        active
                          ? "border-primary bg-primary text-black shadow-soft"
                          : "border-white/10 bg-white/5 text-foreground hover:border-primary/25 hover:bg-white/10"
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </FieldShell>

            <FieldShell label="Category">
              <ComboField
                value={filters.category === "all" ? "" : filters.category}
                options={["All", ...categoryOptions]}
                placeholder="All"
                onChange={(event) => {
                  setVisibleCount(8);
                  setFilters((prev) => ({ ...prev, category: normalizeFilterValue(event.target.value) }));
                }}
              />
            </FieldShell>

            <FieldShell label="Payment">
              <ComboField
                value={filters.paymentMethod === "all" ? "" : filters.paymentMethod}
                options={["All", ...paymentMethodOptions]}
                placeholder="All"
                onChange={(event) => {
                  setVisibleCount(8);
                  setFilters((prev) => ({ ...prev, paymentMethod: normalizeFilterValue(event.target.value) }));
                }}
              />
            </FieldShell>

            <FieldShell label="Start date">
              <InputField
                type="date"
                value={filters.startDate}
                onChange={(event) => {
                  setVisibleCount(8);
                  setFilters((prev) => ({ ...prev, startDate: event.target.value }));
                }}
              />
            </FieldShell>

            <FieldShell label="End date">
              <InputField
                type="date"
                value={filters.endDate}
                onChange={(event) => {
                  setVisibleCount(8);
                  setFilters((prev) => ({ ...prev, endDate: event.target.value }));
                }}
              />
            </FieldShell>
          </div>
          {hasActiveFilters ? (
            <div className="mt-4 hidden md:block"><Button variant="ghost" onClick={resetFilters}>Clear filters</Button></div>
          ) : null}
        </FilterPanel>

        <section className="mt-4 grid gap-3">
          {visibleTransactions.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-lg font-semibold">No transactions found</p>
              <p className="mt-2 text-sm text-muted">Try changing filters or add a new one.</p>
            </Card>
          ) : null}

          {visibleTransactions.map((item) => {
            const isIncome = item.type === "income";
            return (
              <div key={item.id} className="contents">
                <Card key={`${item.id}-mobile`} className="p-4 md:hidden">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-base font-semibold">{item.title}</p>
                        <Badge tone={isIncome ? "green" : "red"}>{isIncome ? "In" : "Out"}</Badge>
                        {item.proofFileName ? <Badge tone="neutral" className="gap-1"><Paperclip className="h-3 w-3" />Proof</Badge> : null}
                      </div>
                      <p className="mt-2 text-sm text-muted">{item.category} • {formatCompactDate(item.date)}</p>
                      <p className="mt-1 text-sm text-muted">{item.paymentMethod}</p>
                    </div>
                    <div className={`shrink-0 text-right text-base font-semibold tabular-nums ${isIncome ? "text-success" : "text-danger"}`}>{isIncome ? "+" : "-"}{formatCurrency(item.amount, state.userSettings.currency)}</div>
                  </div>
                  {item.notes ? <p className="mt-3 line-clamp-2 text-sm leading-5 text-muted">{item.notes}</p> : null}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {item.proofFileName ? <Button variant="secondary" className="col-span-2 h-11 gap-2" onClick={() => void openProof(item)}><Paperclip className="h-4 w-4" />Open proof</Button> : null}
                    <Button variant="secondary" className="h-11 gap-2" onClick={() => setEditingItem(item)}><PencilLine className="h-4 w-4" />Edit</Button>
                    <Button variant="secondary" className="h-11 gap-2 text-danger hover:border-danger/30" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" />Delete</Button>
                  </div>
                </Card>
                <Card key={`${item.id}-desktop`} className="hidden p-5 md:block">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold">{item.title}</p>
                        <Badge tone={isIncome ? "green" : "red"}>{isIncome ? "Income" : "Expense"}</Badge>
                        <Badge tone="neutral">{item.category}</Badge>
                        {item.proofFileName ? <Badge tone="neutral" className="gap-1"><Paperclip className="h-3 w-3" />{item.proofFileName}</Badge> : null}
                      </div>
                      <p className="mt-2 text-sm text-muted">{formatCompactDate(item.date)} • {item.paymentMethod}{item.notes ? ` • ${item.notes}` : ""}</p>
                    </div>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className={`text-right text-2xl font-semibold tabular-nums ${isIncome ? "text-success" : "text-danger"}`}>{isIncome ? "+" : "-"}{formatCurrency(item.amount, state.userSettings.currency)}</div>
                      <div className="flex gap-2">
                        {item.proofFileName ? <Button variant="secondary" className="gap-2" onClick={() => void openProof(item)}><Paperclip className="h-4 w-4" />Proof</Button> : null}
                        <Button variant="secondary" className="gap-2" onClick={() => setEditingItem(item)}><PencilLine className="h-4 w-4" />Edit</Button>
                        <Button variant="secondary" className="gap-2 text-danger hover:border-danger/30" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" />Delete</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </section>

        {visibleTransactions.length < filteredTransactions.length ? (
          <div className="mt-6 flex justify-center">
            <Button variant="secondary" onClick={() => setVisibleCount((prev) => prev + 8)}>Load more</Button>
          </div>
        ) : null}

        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add transaction" description="Save a new income or expense entry.">
          <TransactionForm
            categoryOptions={categoryOptions}
            paymentMethodOptions={paymentMethodOptions}
            submitLabel="Save transaction"
            onCancel={() => setCreateOpen(false)}
            onSubmit={async (input) => {
              const saved = await addTransaction(input);
              if (saved) setCreateOpen(false);
              return saved;
            }}
          />
        </Modal>

        <Modal open={Boolean(editingItem)} onClose={() => setEditingItem(null)} title="Edit transaction" description="Update this entry and the dashboard will refresh instantly.">
          {editingItem ? (
            <TransactionForm
              initialValue={editingItem}
              categoryOptions={categoryOptions}
              paymentMethodOptions={paymentMethodOptions}
              submitLabel="Update transaction"
              onCancel={() => setEditingItem(null)}
              onSubmit={async (input) => {
                const saved = await updateTransaction(editingItem.id, input);
                if (saved) setEditingItem(null);
                return saved;
              }}
            />
          ) : null}
        </Modal>
      </div>
    </AppShell>
  );
}
