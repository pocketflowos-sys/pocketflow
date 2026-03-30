"use client";

import { useMemo, useState } from "react";
import { CreditCard, PencilLine, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { CreditCardForm } from "@/components/credit-cards/credit-card-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldShell, InputField } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SummaryCard } from "@/components/ui/summary-card";
import { getCreditCardOutstanding, getCreditUtilization } from "@/lib/finance";
import { formatCompactDate, formatCurrency } from "@/lib/formatters";
import { usePocketFlow } from "@/lib/pocketflow-store";
import type { CreditCard as CreditCardItem } from "@/lib/types";

export function CreditCardsPage() {
  const { state, addCreditCard, updateCreditCard, deleteCreditCard } = usePocketFlow();
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<CreditCardItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const rows = useMemo(() => {
    return [...state.creditCards]
      .map((item) => ({ ...item, outstanding: getCreditCardOutstanding(item.currentBalance, item.amountPaid), utilization: getCreditUtilization(item.currentBalance, item.creditLimit) }))
      .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
      .filter((item) => `${item.cardName} ${item.issuer} ${item.notes ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  }, [search, state.creditCards]);

  const summary = useMemo(() => ({
    totalOutstanding: rows.reduce((sum, item) => sum + item.outstanding, 0),
    totalLimit: rows.reduce((sum, item) => sum + item.creditLimit, 0),
    totalSpent: rows.reduce((sum, item) => sum + item.currentBalance, 0),
    dueSoon: rows.filter((item) => item.outstanding > 0).length
  }), [rows]);

  function handleDelete(id: string) { if (window.confirm("Delete this credit card?")) void deleteCreditCard(id); }

  return (
    <AppShell>
      <PageHeader compact eyebrow="Credit card management" title="Credit Cards" description="Track billing date, due date, credit limit, spend, and outstanding balance." actions={<Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Add card</Button>} />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard title="Outstanding" value={formatCurrency(summary.totalOutstanding, state.userSettings.currency)} detail="Amount still to pay" tone={summary.totalOutstanding > 0 ? "red" : "green"} icon={<CreditCard className="h-5 w-5" />} />
        <SummaryCard title="Credit limit" value={formatCurrency(summary.totalLimit, state.userSettings.currency)} detail="Combined card limits" />
        <SummaryCard title="Card spending" value={formatCurrency(summary.totalSpent, state.userSettings.currency)} detail="Current cycle usage" tone="gold" />
        <SummaryCard title="Cards due" value={String(summary.dueSoon)} detail="Cards with open balance" />
      </section>

      <Card className="mt-4 p-4 md:p-6"><FieldShell label="Search cards"><InputField value={search} placeholder="HDFC, SBI, travel card" onChange={(event) => setSearch(event.target.value)} /></FieldShell></Card>

      <section className="mt-4 grid gap-3">
        {rows.length === 0 ? <Card className="p-8 text-center"><p className="text-lg font-semibold">No credit cards found</p><p className="mt-2 text-sm text-muted">Add your first card to start tracking limits and due amounts.</p></Card> : null}
        {rows.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2"><p className="text-lg font-semibold">{item.cardName}</p><Badge tone={item.outstanding > 0 ? "red" : "green"}>{item.issuer}</Badge></div>
                <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-2 lg:grid-cols-4">
                  <div><p>Outstanding</p><p className="mt-1 font-semibold text-white">{formatCurrency(item.outstanding, state.userSettings.currency)}</p></div>
                  <div><p>Limit</p><p className="mt-1 font-semibold text-white">{formatCurrency(item.creditLimit, state.userSettings.currency)}</p></div>
                  <div><p>Current spend</p><p className="mt-1 font-semibold text-white">{formatCurrency(item.currentBalance, state.userSettings.currency)}</p></div>
                  <div><p>Utilization</p><p className="mt-1 font-semibold text-white">{item.utilization.toFixed(0)}%</p></div>
                </div>
                <p className="mt-4 text-sm text-muted">Billing {formatCompactDate(item.billingDate)} • Due {formatCompactDate(item.dueDate)}{item.notes ? ` • ${item.notes}` : ""}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row xl:flex-col"><Button variant="secondary" className="gap-2" onClick={() => setEditingItem(item)}><PencilLine className="h-4 w-4" />Edit</Button><Button variant="secondary" className="gap-2 text-danger hover:border-danger/30" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" />Delete</Button></div>
            </div>
          </Card>
        ))}
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add credit card" description="Save a card with its due date, limit, and current balance."><CreditCardForm submitLabel="Save card" onCancel={() => setCreateOpen(false)} onSubmit={async (input) => { const saved = await addCreditCard(input); if (saved) setCreateOpen(false); return saved; }} /></Modal>
      <Modal open={Boolean(editingItem)} onClose={() => setEditingItem(null)} title="Edit credit card" description="Update due dates, spend, and paid amount.">{editingItem ? <CreditCardForm initialValue={editingItem} submitLabel="Update card" onCancel={() => setEditingItem(null)} onSubmit={async (input) => { const saved = await updateCreditCard(editingItem.id, input); if (saved) setEditingItem(null); return saved; }} /> : null}</Modal>
    </AppShell>
  );
}
