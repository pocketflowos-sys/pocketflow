"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldShell, InputField, SelectField, TextareaField } from "@/components/ui/form-controls";
import { getTodayIso } from "@/lib/formatters";
import type { Investment } from "@/lib/types";

type InvestmentFormValues = Omit<Investment, "id">;

function getDefaults(item?: Investment): InvestmentFormValues {
  return {
    date: item?.date ?? getTodayIso(),
    investmentType: item?.investmentType ?? "Mutual Fund",
    platform: item?.platform ?? "Groww",
    investedAmount: item?.investedAmount ?? 0,
    currentValue: item?.currentValue ?? 0,
    withdrawnAmount: item?.withdrawnAmount ?? 0,
    notes: item?.notes ?? ""
  };
}

export function InvestmentForm({
  initialValue,
  investmentTypeOptions,
  platformOptions,
  submitLabel,
  onCancel,
  onSubmit
}: {
  initialValue?: Investment;
  investmentTypeOptions: string[];
  platformOptions: string[];
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (input: InvestmentFormValues) => Promise<boolean> | void;
}) {
  const [form, setForm] = useState<InvestmentFormValues>(getDefaults(initialValue));
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!form.investmentType.trim()) return setError("Please enter an investment type.");
    if (!form.platform.trim()) return setError("Please enter a platform or broker.");
    if (!form.investedAmount || form.investedAmount <= 0) return setError("Invested amount must be more than zero.");
    if (form.currentValue < 0) return setError("Current value cannot be negative.");
    if (form.withdrawnAmount < 0) return setError("Withdrawn amount cannot be negative.");
    setError("");
    onSubmit({
      ...form,
      investmentType: form.investmentType.trim(),
      platform: form.platform.trim(),
      notes: form.notes?.trim() ?? ""
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell label="Date">
          <InputField type="date" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} />
        </FieldShell>
        <FieldShell label="Investment type">
          <SelectField value={form.investmentType} onChange={(event) => setForm((prev) => ({ ...prev, investmentType: event.target.value }))}>
            {investmentTypeOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectField>
        </FieldShell>
        <FieldShell label="Platform / broker">
          <SelectField value={form.platform} onChange={(event) => setForm((prev) => ({ ...prev, platform: event.target.value }))}>
            {platformOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectField>
        </FieldShell>
        <FieldShell label="Invested amount">
          <InputField type="number" min="0" value={form.investedAmount || ""} onChange={(event) => setForm((prev) => ({ ...prev, investedAmount: Number(event.target.value) }))} />
        </FieldShell>
        <FieldShell label="Current value">
          <InputField type="number" min="0" value={form.currentValue || ""} onChange={(event) => setForm((prev) => ({ ...prev, currentValue: Number(event.target.value) }))} />
        </FieldShell>
        <FieldShell label="Withdrawn amount">
          <InputField type="number" min="0" value={form.withdrawnAmount || ""} onChange={(event) => setForm((prev) => ({ ...prev, withdrawnAmount: Number(event.target.value) }))} />
        </FieldShell>
        <FieldShell label="Notes" className="sm:col-span-2">
          <TextareaField rows={4} value={form.notes ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
        </FieldShell>
      </div>

      {error ? <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>{submitLabel}</Button>
      </div>
    </div>
  );
}
