"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldShell, InputField, SelectField, TextareaField } from "@/components/ui/form-controls";
import { getTodayIso } from "@/lib/formatters";
import type { LendBorrowEntry } from "@/lib/types";

type LendBorrowFormValues = Omit<LendBorrowEntry, "id">;

function getDefaults(item?: LendBorrowEntry): LendBorrowFormValues {
  return {
    date: item?.date ?? getTodayIso(),
    person: item?.person ?? "",
    type: item?.type ?? "given",
    amount: item?.amount ?? 0,
    amountSettled: item?.amountSettled ?? 0,
    dueDate: item?.dueDate ?? "",
    notes: item?.notes ?? ""
  };
}

export function LendBorrowForm({
  initialValue,
  submitLabel,
  onCancel,
  onSubmit
}: {
  initialValue?: LendBorrowEntry;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (input: LendBorrowFormValues) => Promise<boolean> | void;
}) {
  const [form, setForm] = useState<LendBorrowFormValues>(getDefaults(initialValue));
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!form.person.trim()) {
      return setError("Please enter the person or company name.");
    }
    if (!form.amount || form.amount <= 0) {
      return setError("Amount must be more than zero.");
    }
    if (form.amountSettled < 0 || form.amountSettled > form.amount) {
      return setError("Settled amount must be between 0 and total amount.");
    }
    setError("");
    onSubmit({
      ...form,
      person: form.person.trim(),
      dueDate: form.dueDate || undefined,
      notes: form.notes?.trim() ?? ""
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell label="Date">
          <InputField type="date" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} />
        </FieldShell>
        <FieldShell label="Type">
          <SelectField value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as LendBorrowEntry["type"] }))}>
            <option value="given">Given</option>
            <option value="borrowed">Borrowed</option>
          </SelectField>
        </FieldShell>
        <FieldShell label="Person / company" className="sm:col-span-2">
          <InputField value={form.person} onChange={(event) => setForm((prev) => ({ ...prev, person: event.target.value }))} />
        </FieldShell>
        <FieldShell label="Amount">
          <InputField type="number" min="0" value={form.amount || ""} onChange={(event) => setForm((prev) => ({ ...prev, amount: Number(event.target.value) }))} />
        </FieldShell>
        <FieldShell label="Amount settled">
          <InputField type="number" min="0" value={form.amountSettled || ""} onChange={(event) => setForm((prev) => ({ ...prev, amountSettled: Number(event.target.value) }))} />
        </FieldShell>
        <FieldShell label="Due date">
          <InputField type="date" value={form.dueDate ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))} />
        </FieldShell>
        <FieldShell label="Notes">
          <TextareaField rows={4} value={form.notes ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
        </FieldShell>
      </div>

      {error ? (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>{submitLabel}</Button>
      </div>
    </div>
  );
}
