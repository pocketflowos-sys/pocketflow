"use client";

import { useMemo, useState } from "react";
import { CircleAlert, HandCoins, PencilLine, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LendBorrowForm } from "@/components/lend-borrow/lend-borrow-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldShell, InputField, SelectField } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SummaryCard } from "@/components/ui/summary-card";
import { getLendBorrowBalance, getLendBorrowStatus } from "@/lib/finance";
import { formatCompactDate, formatCurrency } from "@/lib/formatters";
import { usePocketFlow } from "@/lib/pocketflow-store";
import type { LendBorrowEntry } from "@/lib/types";

const defaultFilters = {
  search: "",
  type: "all",
  status: "all"
};

export function LendBorrowPage() {
  const { state, addLendBorrowEntry, updateLendBorrowEntry, deleteLendBorrowEntry } = usePocketFlow();
  const [filters, setFilters] = useState(defaultFilters);
  const [editingItem, setEditingItem] = useState<LendBorrowEntry | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const rows = useMemo(() => {
    return [...state.lendBorrowEntries]
      .map((item) => {
        const balance = getLendBorrowBalance(item.amount, item.amountSettled);
        const status = getLendBorrowStatus(item);
        return { ...item, balance, status };
      })
      .sort((a, b) => +new Date(a.dueDate ?? a.date) - +new Date(b.dueDate ?? b.date))
      .filter((item) => {
        const searchTarget = `${item.person} ${item.notes ?? ""}`.toLowerCase();
        const matchesSearch = filters.search ? searchTarget.includes(filters.search.toLowerCase()) : true;
        const matchesType = filters.type === "all" ? true : item.type === filters.type;
        const normalizedStatus = item.balance === 0 ? "closed" : item.amountSettled > 0 ? "partial" : "pending";
        const matchesStatus = filters.status === "all" ? true : normalizedStatus === filters.status;
        return matchesSearch && matchesType && matchesStatus;
      });
  }, [filters, state.lendBorrowEntries]);

  const summary = useMemo(() => {
    const totalToReceive = rows
      .filter((item) => item.type === "given")
      .reduce((sum, item) => sum + item.balance, 0);
    const totalToPay = rows
      .filter((item) => item.type === "borrowed")
      .reduce((sum, item) => sum + item.balance, 0);
    const overdueAmount = rows.filter((item) => item.status.overdue).reduce((sum, item) => sum + item.balance, 0);
    const closedEntries = rows.filter((item) => item.balance === 0).length;
    return { totalToReceive, totalToPay, overdueAmount, closedEntries };
  }, [rows]);

  function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this lend / borrow entry?");
    if (confirmed) {
      deleteLendBorrowEntry(id);
    }
  }

  function markClosed(item: LendBorrowEntry) {
    updateLendBorrowEntry(item.id, {
      ...item,
      amountSettled: item.amount
    });
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Lending & borrowing"
        title="Lend / Borrow Tracker"
        description="Track what you gave, what you borrowed, due dates, balances, and overdue items in one clean view."
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add entry
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total to receive" value={formatCurrency(summary.totalToReceive, state.userSettings.currency)} detail="Open balances from given money" tone="green" icon={<HandCoins className="h-5 w-5" />} />
        <SummaryCard title="Total to pay" value={formatCurrency(summary.totalToPay, state.userSettings.currency)} detail="Open balances from borrowed money" tone="red" />
        <SummaryCard title="Overdue amount" value={formatCurrency(summary.overdueAmount, state.userSettings.currency)} detail="Need follow-up soon" tone={summary.overdueAmount > 0 ? "red" : "green"} />
        <SummaryCard title="Closed entries" value={String(summary.closedEntries)} detail="Fully settled records" tone="gold" />
      </section>

      <Card className="mt-6 p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <FieldShell label="Search name or note">
            <InputField value={filters.search} placeholder="Afsal, vendor, family" onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))} />
          </FieldShell>
          <FieldShell label="Type">
            <SelectField value={filters.type} onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}>
              <option value="all">All</option>
              <option value="given">Given</option>
              <option value="borrowed">Borrowed</option>
            </SelectField>
          </FieldShell>
          <FieldShell label="Status">
            <SelectField value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="closed">Closed</option>
            </SelectField>
          </FieldShell>
        </div>
      </Card>

      <section className="mt-6 grid gap-4">
        {rows.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-lg font-semibold">No lend / borrow entries found</p>
            <p className="mt-2 text-sm text-muted">Change the filters or add a new entry.</p>
          </Card>
        ) : null}

        {rows.map((item) => (
          <Card key={item.id} className={`p-5 ${item.status.overdue ? "border-danger/30" : ""}`}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold">{item.person}</p>
                  <Badge tone={item.type === "given" ? "green" : "red"}>
                    {item.type === "given" ? "Given" : "Borrowed"}
                  </Badge>
                  <Badge tone={item.status.tone}>{item.status.label}</Badge>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p>Total amount</p>
                    <p className="mt-1 font-semibold text-white">{formatCurrency(item.amount, state.userSettings.currency)}</p>
                  </div>
                  <div>
                    <p>Settled</p>
                    <p className="mt-1 font-semibold text-white">{formatCurrency(item.amountSettled, state.userSettings.currency)}</p>
                  </div>
                  <div>
                    <p>Balance</p>
                    <p className={`mt-1 font-semibold ${item.balance > 0 ? "text-primary" : "text-success"}`}>
                      {formatCurrency(item.balance, state.userSettings.currency)}
                    </p>
                  </div>
                  <div>
                    <p>Due date</p>
                    <p className="mt-1 font-semibold text-white">
                      {item.dueDate ? formatCompactDate(item.dueDate) : "Not set"}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-muted">
                  Added {formatCompactDate(item.date)}
                  {item.notes ? ` • ${item.notes}` : ""}
                </p>

                {item.status.overdue ? (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                    <CircleAlert className="h-4 w-4" />
                    This entry is overdue and still has an open balance.
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row xl:flex-col xl:items-stretch">
                {item.balance > 0 ? (
                  <Button variant="secondary" onClick={() => markClosed(item)}>
                    Mark closed
                  </Button>
                ) : null}
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add lend / borrow entry" description="Save a new receivable or payable.">
        <LendBorrowForm
          submitLabel="Save entry"
          onCancel={() => setCreateOpen(false)}
          onSubmit={async (input) => {
            const saved = await addLendBorrowEntry(input);
            if (saved) setCreateOpen(false);
            return saved;
          }}
        />
      </Modal>

      <Modal open={Boolean(editingItem)} onClose={() => setEditingItem(null)} title="Edit lend / borrow entry" description="Update amounts, settlements, or due dates.">
        {editingItem ? (
          <LendBorrowForm
            initialValue={editingItem}
            submitLabel="Update entry"
            onCancel={() => setEditingItem(null)}
            onSubmit={async (input) => {
              const saved = await updateLendBorrowEntry(editingItem.id, input);
              if (saved) setEditingItem(null);
              return saved;
            }}
          />
        ) : null}
      </Modal>
    </AppShell>
  );
}
