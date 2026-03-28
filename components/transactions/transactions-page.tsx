"use client";

import { useMemo, useState } from "react";
import { Download, PencilLine, Plus, Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldShell, InputField, SelectField } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SummaryCard } from "@/components/ui/summary-card";
import { downloadCsv } from "@/lib/finance";
import { formatCompactDate, formatCsvDate, formatCurrency } from "@/lib/formatters";
import { usePocketFlow, usePocketFlowOptions } from "@/lib/pocketflow-store";
import type { Transaction } from "@/lib/types";

const defaultFilters = {
  search: "",
  type: "all",
  category: "all",
  paymentMethod: "all",
  startDate: "",
  endDate: ""
};

export function TransactionsPage() {
  const { state, addTransaction, updateTransaction, deleteTransaction } = usePocketFlow();
  const { categories, paymentMethods } = usePocketFlowOptions();
  const [filters, setFilters] = useState(defaultFilters);
  const [visibleCount, setVisibleCount] = useState(8);
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const categoryOptions = useMemo(
    () => Array.from(new Set([...categories, ...state.transactions.map((item) => item.category)])).sort(),
    [categories, state.transactions]
  );
  const paymentMethodOptions = useMemo(
    () => Array.from(new Set([...paymentMethods, ...state.transactions.map((item) => item.paymentMethod)])).sort(),
    [paymentMethods, state.transactions]
  );

  const filteredTransactions = useMemo(() => {
    return [...state.transactions]
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .filter((item) => {
        const searchTarget = `${item.title} ${item.category} ${item.paymentMethod} ${item.notes ?? ""}`.toLowerCase();
        const matchesSearch = filters.search
          ? searchTarget.includes(filters.search.toLowerCase())
          : true;
        const matchesType = filters.type === "all" ? true : item.type === filters.type;
        const matchesCategory = filters.category === "all" ? true : item.category === filters.category;
        const matchesPayment =
          filters.paymentMethod === "all" ? true : item.paymentMethod === filters.paymentMethod;
        const matchesStart = filters.startDate ? item.date >= filters.startDate : true;
        const matchesEnd = filters.endDate ? item.date <= filters.endDate : true;
        return matchesSearch && matchesType && matchesCategory && matchesPayment && matchesStart && matchesEnd;
      });
  }, [filters, state.transactions]);

  const visibleTransactions = filteredTransactions.slice(0, visibleCount);

  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0);
    const expense = filteredTransactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);
    return {
      income,
      expense,
      balance: income - expense,
      count: filteredTransactions.length
    };
  }, [filteredTransactions]);

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
    const confirmed = window.confirm("Delete this transaction from PocketFlow?");
    if (confirmed) {
      deleteTransaction(id);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Money movement"
        title="Transactions"
        description="Search, filter, export, edit, and delete your saved transactions. Everything updates the dashboard immediately."
        actions={
          <>
            <Button variant="secondary" onClick={exportTransactions} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add transaction
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Filtered income" value={formatCurrency(summary.income, state.userSettings.currency)} detail="Based on current filters" tone="green" />
        <SummaryCard title="Filtered expenses" value={formatCurrency(summary.expense, state.userSettings.currency)} detail="What went out in this view" tone="red" />
        <SummaryCard title="Net movement" value={formatCurrency(summary.balance, state.userSettings.currency)} detail="Income minus expense" tone={summary.balance >= 0 ? "green" : "red"} />
        <SummaryCard title="Entries shown" value={String(summary.count)} detail="Transactions matching your filters" />
      </section>

      <Card className="mt-6 p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <FieldShell label="Search" className="xl:col-span-2">
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

          <FieldShell label="Type">
            <SelectField
              value={filters.type}
              onChange={(event) => {
                setVisibleCount(8);
                setFilters((prev) => ({ ...prev, type: event.target.value }));
              }}
            >
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </SelectField>
          </FieldShell>

          <FieldShell label="Category">
            <SelectField
              value={filters.category}
              onChange={(event) => {
                setVisibleCount(8);
                setFilters((prev) => ({ ...prev, category: event.target.value }));
              }}
            >
              <option value="all">All</option>
              {categoryOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectField>
          </FieldShell>

          <FieldShell label="Payment">
            <SelectField
              value={filters.paymentMethod}
              onChange={(event) => {
                setVisibleCount(8);
                setFilters((prev) => ({ ...prev, paymentMethod: event.target.value }));
              }}
            >
              <option value="all">All</option>
              {paymentMethodOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectField>
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

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Badge tone="neutral">{filteredTransactions.length} matching entries</Badge>
          {(filters.search || filters.type !== "all" || filters.category !== "all" || filters.paymentMethod !== "all" || filters.startDate || filters.endDate) ? (
            <Button variant="ghost" onClick={() => { setVisibleCount(8); setFilters(defaultFilters); }}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </Card>

      <section className="mt-6 grid gap-4">
        {visibleTransactions.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-lg font-semibold">No transactions found</p>
            <p className="mt-2 text-sm text-muted">Try changing the filters or add a new transaction.</p>
          </Card>
        ) : null}

        {visibleTransactions.map((item) => {
          const isIncome = item.type === "income";
          return (
            <Card key={item.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold">{item.title}</p>
                    <Badge tone={isIncome ? "green" : "red"}>{isIncome ? "Income" : "Expense"}</Badge>
                    <Badge tone="neutral">{item.category}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {formatCompactDate(item.date)} • {item.paymentMethod}
                    {item.notes ? ` • ${item.notes}` : ""}
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className={`text-right text-2xl font-semibold ${isIncome ? "text-success" : "text-danger"}`}>
                    {isIncome ? "+" : "-"}
                    {formatCurrency(item.amount, state.userSettings.currency)}
                  </div>
                  <div className="flex gap-2">
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
              </div>
            </Card>
          );
        })}
      </section>

      {visibleTransactions.length < filteredTransactions.length ? (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={() => setVisibleCount((prev) => prev + 8)}>
            Load more
          </Button>
        </div>
      ) : null}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add transaction"
        description="Save a new income or expense entry."
      >
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

      <Modal
        open={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        title="Edit transaction"
        description="Update this entry and the dashboard will refresh instantly."
      >
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
    </AppShell>
  );
}
