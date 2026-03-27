"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldShell, InputField } from "@/components/ui/form-controls";
import { getMonthKey, getTodayIso } from "@/lib/formatters";
import type { Budget } from "@/lib/types";

type BudgetFormValues = Omit<Budget, "id">;

function getDefaults(budget?: Budget): BudgetFormValues {
  return {
    month: budget?.month ?? getMonthKey(getTodayIso()),
    category: budget?.category ?? "Food",
    amount: budget?.amount ?? 0
  };
}

export function BudgetForm({
  initialValue,
  categoryOptions,
  onCancel,
  onSubmit,
  submitLabel
}: {
  initialValue?: Budget;
  categoryOptions: string[];
  onCancel: () => void;
  onSubmit: (input: BudgetFormValues) => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<BudgetFormValues>(getDefaults(initialValue));
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!form.category.trim()) {
      return setError("Please enter a category.");
    }
    if (!form.amount || form.amount <= 0) {
      return setError("Budget amount must be more than zero.");
    }
    setError("");
    onSubmit({ ...form, category: form.category.trim() });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell label="Month">
          <InputField
            type="month"
            value={form.month}
            onChange={(event) => setForm((prev) => ({ ...prev, month: event.target.value }))}
          />
        </FieldShell>
        <FieldShell label="Budget amount">
          <InputField
            type="number"
            min="0"
            value={form.amount || ""}
            onChange={(event) => setForm((prev) => ({ ...prev, amount: Number(event.target.value) }))}
          />
        </FieldShell>
        <FieldShell label="Category" className="sm:col-span-2">
          <InputField
            list="budget-category-options"
            value={form.category}
            placeholder="Food, Housing, Bills"
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
          />
          <datalist id="budget-category-options">
            {categoryOptions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </FieldShell>
      </div>

      {error ? (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>{submitLabel}</Button>
      </div>
    </div>
  );
}
