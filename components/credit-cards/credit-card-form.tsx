"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldShell, InputField, TextareaField } from "@/components/ui/form-controls";
import { getTodayIso } from "@/lib/formatters";
import type { CreditCard } from "@/lib/types";

type CreditCardFormValues = Omit<CreditCard, "id">;

function getDefaults(item?: CreditCard): CreditCardFormValues {
  return {
    cardName: item?.cardName ?? "",
    issuer: item?.issuer ?? "",
    billingDate: item?.billingDate ?? getTodayIso(),
    dueDate: item?.dueDate ?? getTodayIso(),
    creditLimit: item?.creditLimit ?? 0,
    currentBalance: item?.currentBalance ?? 0,
    amountPaid: item?.amountPaid ?? 0,
    notes: item?.notes ?? ""
  };
}

export function CreditCardForm({ initialValue, submitLabel, onCancel, onSubmit }: { initialValue?: CreditCard; submitLabel: string; onCancel: () => void; onSubmit: (input: CreditCardFormValues) => Promise<boolean> | void; }) {
  const [form, setForm] = useState<CreditCardFormValues>(getDefaults(initialValue));
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!form.cardName.trim()) return setError("Please enter a card name.");
    if (!form.issuer.trim()) return setError("Please enter an issuer or bank.");
    if (form.creditLimit < 0 || form.currentBalance < 0 || form.amountPaid < 0) return setError("Amounts cannot be negative.");
    setError("");
    onSubmit({ ...form, cardName: form.cardName.trim(), issuer: form.issuer.trim(), notes: form.notes?.trim() ?? "" });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell label="Card name"><InputField value={form.cardName} onChange={(event) => setForm((prev) => ({ ...prev, cardName: event.target.value }))} /></FieldShell>
        <FieldShell label="Issuer / bank"><InputField value={form.issuer} onChange={(event) => setForm((prev) => ({ ...prev, issuer: event.target.value }))} /></FieldShell>
        <FieldShell label="Billing date"><InputField type="date" value={form.billingDate} onChange={(event) => setForm((prev) => ({ ...prev, billingDate: event.target.value }))} /></FieldShell>
        <FieldShell label="Due date"><InputField type="date" value={form.dueDate} onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))} /></FieldShell>
        <FieldShell label="Credit limit"><InputField type="number" min="0" value={form.creditLimit || ""} onChange={(event) => setForm((prev) => ({ ...prev, creditLimit: Number(event.target.value) }))} /></FieldShell>
        <FieldShell label="Current balance"><InputField type="number" min="0" value={form.currentBalance || ""} onChange={(event) => setForm((prev) => ({ ...prev, currentBalance: Number(event.target.value) }))} /></FieldShell>
        <FieldShell label="Amount already paid"><InputField type="number" min="0" value={form.amountPaid || ""} onChange={(event) => setForm((prev) => ({ ...prev, amountPaid: Number(event.target.value) }))} /></FieldShell>
        <FieldShell label="Notes" className="sm:col-span-2"><TextareaField rows={4} value={form.notes ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} /></FieldShell>
      </div>
      {error ? <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button onClick={handleSubmit}>{submitLabel}</Button></div>
    </div>
  );
}
