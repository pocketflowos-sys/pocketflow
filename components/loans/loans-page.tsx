"use client";

import { useMemo, useState } from "react";
import { PencilLine, Plus, ReceiptText, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LoanForm } from "@/components/loans/loan-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldShell, InputField } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SummaryCard } from "@/components/ui/summary-card";
import { getLoanOutstanding, getLoanProgress } from "@/lib/finance";
import { formatCompactDate, formatCurrency } from "@/lib/formatters";
import { usePocketFlow } from "@/lib/pocketflow-store";
import type { Loan } from "@/lib/types";

export function LoansPage() {
  const { state, addLoan, updateLoan, deleteLoan } = usePocketFlow();
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<Loan | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const rows = useMemo(() => {
    return [...state.loans]
      .map((item) => ({ ...item, outstanding: getLoanOutstanding(item.outstandingAmount), progress: getLoanProgress(item.principalAmount, item.outstandingAmount) }))
      .sort((a, b) => +new Date(a.nextEmiDate ?? a.dueDate ?? a.startDate) - +new Date(b.nextEmiDate ?? b.dueDate ?? b.startDate))
      .filter((item) => `${item.loanName} ${item.lender} ${item.notes ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  }, [search, state.loans]);

  const summary = useMemo(() => ({
    outstanding: rows.reduce((sum, item) => sum + item.outstanding, 0),
    emiLoad: rows.reduce((sum, item) => sum + item.emiAmount, 0),
    principal: rows.reduce((sum, item) => sum + item.principalAmount, 0),
    activeLoans: rows.length
  }), [rows]);

  function handleDelete(id: string) { if (window.confirm("Delete this loan entry?")) void deleteLoan(id); }

  return (
    <AppShell>
      <PageHeader compact eyebrow="Loan & EMI tracking" title="Loans & EMI" description="Track outstanding amount, EMI date, lender, and progress in one place." actions={<Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Add loan</Button>} />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard title="Outstanding" value={formatCurrency(summary.outstanding, state.userSettings.currency)} detail="Remaining loan balance" tone={summary.outstanding > 0 ? "red" : "green"} icon={<ReceiptText className="h-5 w-5" />} />
        <SummaryCard title="EMI load" value={formatCurrency(summary.emiLoad, state.userSettings.currency)} detail="Tracked monthly EMI amount" />
        <SummaryCard title="Principal total" value={formatCurrency(summary.principal, state.userSettings.currency)} detail="Original loan value" tone="gold" />
        <SummaryCard title="Active loans" value={String(summary.activeLoans)} detail="Saved in your workspace" />
      </section>

      <Card className="mt-4 p-4 md:p-6"><FieldShell label="Search loans"><InputField value={search} placeholder="Car loan, HDFC, EMI" onChange={(event) => setSearch(event.target.value)} /></FieldShell></Card>

      <section className="mt-4 grid gap-3">
        {rows.length === 0 ? <Card className="p-8 text-center"><p className="text-lg font-semibold">No loans found</p><p className="mt-2 text-sm text-muted">Add your first loan or EMI plan to start tracking it.</p></Card> : null}
        {rows.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2"><p className="text-lg font-semibold">{item.loanName}</p><Badge tone={item.outstanding > 0 ? "red" : "green"}>{item.lender}</Badge></div>
                <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-2 lg:grid-cols-4">
                  <div><p>Outstanding</p><p className="mt-1 font-semibold text-white">{formatCurrency(item.outstanding, state.userSettings.currency)}</p></div>
                  <div><p>EMI amount</p><p className="mt-1 font-semibold text-white">{formatCurrency(item.emiAmount, state.userSettings.currency)}</p></div>
                  <div><p>Progress</p><p className="mt-1 font-semibold text-white">{item.progress.toFixed(0)}%</p></div>
                  <div><p>Interest</p><p className="mt-1 font-semibold text-white">{item.interestRate.toFixed(2)}%</p></div>
                </div>
                <p className="mt-4 text-sm text-muted">Started {formatCompactDate(item.startDate)} • Next EMI {item.nextEmiDate ? formatCompactDate(item.nextEmiDate) : "Not set"}{item.notes ? ` • ${item.notes}` : ""}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row xl:flex-col"><Button variant="secondary" className="gap-2" onClick={() => setEditingItem(item)}><PencilLine className="h-4 w-4" />Edit</Button><Button variant="secondary" className="gap-2 text-danger hover:border-danger/30" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" />Delete</Button></div>
            </div>
          </Card>
        ))}
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add loan / EMI" description="Save a loan with outstanding amount and next EMI date."><LoanForm submitLabel="Save loan" onCancel={() => setCreateOpen(false)} onSubmit={async (input) => { const saved = await addLoan(input); if (saved) setCreateOpen(false); return saved; }} /></Modal>
      <Modal open={Boolean(editingItem)} onClose={() => setEditingItem(null)} title="Edit loan / EMI" description="Update balance, EMI, lender, or next due date.">{editingItem ? <LoanForm initialValue={editingItem} submitLabel="Update loan" onCancel={() => setEditingItem(null)} onSubmit={async (input) => { const saved = await updateLoan(editingItem.id, input); if (saved) setEditingItem(null); return saved; }} /> : null}</Modal>
    </AppShell>
  );
}
