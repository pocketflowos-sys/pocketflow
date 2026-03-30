"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldShell, InputField, TextareaField } from "@/components/ui/form-controls";
import { getTodayIso } from "@/lib/formatters";
import type { Loan } from "@/lib/types";

type LoanFormValues = Omit<Loan, "id">;

function getDefaults(item?: Loan): LoanFormValues {
  return {
    loanName: item?.loanName ?? "",
    lender: item?.lender ?? "",
    startDate: item?.startDate ?? getTodayIso(),
    dueDate: item?.dueDate ?? "",
    principalAmount: item?.principalAmount ?? 0,
    outstandingAmount: item?.outstandingAmount ?? 0,
    emiAmount: item?.emiAmount ?? 0,
    nextEmiDate: item?.nextEmiDate ?? getTodayIso(),
    interestRate: item?.interestRate ?? 0,
    notes: item?.notes ?? ""
  };
}

export function LoanForm({ initialValue, submitLabel, onCancel, onSubmit }: { initialValue?: Loan; submitLabel: string; onCancel: () => void; onSubmit: (input: LoanFormValues) => Promise<boolean> | void; }) {
  const [form, setForm] = useState<LoanFormValues>(getDefaults(initialValue));
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!form.loanName.trim()) return setError("Please enter a loan name.");
    if (!form.lender.trim()) return setError("Please enter a lender.");
    if (form.principalAmount < 0 || form.outstandingAmount < 0 || form.emiAmount < 0 || form.interestRate < 0) return setError("Amounts cannot be negative.");
    setError("");
    onSubmit({ ...form, loanName: form.loanName.trim(), lender: form.lender.trim(), dueDate: form.dueDate || undefined, nextEmiDate: form.nextEmiDate || undefined, notes: form.notes?.trim() ?? "" });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell label="Loan name"><InputField value={form.loanName} onChange={(event) => setForm((prev) => ({ ...prev, loanName: event.target.value }))} /></FieldShell>
        <FieldShell label="Lender"><InputField value={form.lender} onChange={(event) => setForm((prev) => ({ ...prev, lender: event.target.value }))} /></FieldShell>
        <FieldShell label="Start date"><InputField type="date" value={form.startDate} onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))} /></FieldShell>
        <FieldShell label="Overall due date"><InputField type="date" value={form.dueDate ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))} /></FieldShell>
        <FieldShell label="Principal amount"><InputField type="number" min="0" value={form.principalAmount || ""} onChange={(event) => setForm((prev) => ({ ...prev, principalAmount: Number(event.target.value) }))} /></FieldShell>
        <FieldShell label="Outstanding amount"><InputField type="number" min="0" value={form.outstandingAmount || ""} onChange={(event) => setForm((prev) => ({ ...prev, outstandingAmount: Number(event.target.value) }))} /></FieldShell>
        <FieldShell label="EMI amount"><InputField type="number" min="0" value={form.emiAmount || ""} onChange={(event) => setForm((prev) => ({ ...prev, emiAmount: Number(event.target.value) }))} /></FieldShell>
        <FieldShell label="Next EMI date"><InputField type="date" value={form.nextEmiDate ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, nextEmiDate: event.target.value }))} /></FieldShell>
        <FieldShell label="Interest rate (%)"><InputField type="number" min="0" step="0.01" value={form.interestRate || ""} onChange={(event) => setForm((prev) => ({ ...prev, interestRate: Number(event.target.value) }))} /></FieldShell>
        <FieldShell label="Notes" className="sm:col-span-2"><TextareaField rows={4} value={form.notes ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} /></FieldShell>
      </div>
      {error ? <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button onClick={handleSubmit}>{submitLabel}</Button></div>
    </div>
  );
}
