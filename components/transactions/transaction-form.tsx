"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldShell, InputField, SelectField, TextareaField } from "@/components/ui/form-controls";
import { getTodayIso } from "@/lib/formatters";
import type { Transaction } from "@/lib/types";

type TransactionFormValues = Omit<Transaction, "id">;

function getDefaults(transaction?: Transaction): TransactionFormValues {
  return {
    date: transaction?.date ?? getTodayIso(),
    type: transaction?.type ?? "expense",
    title: transaction?.title ?? "",
    category: transaction?.category ?? "Food",
    amount: transaction?.amount ?? 0,
    paymentMethod: transaction?.paymentMethod ?? "UPI",
    notes: transaction?.notes ?? ""
  };
}

export function TransactionForm({
  initialValue,
  categoryOptions,
  paymentMethodOptions,
  submitLabel,
  onCancel,
  onSubmit
}: {
  initialValue?: Transaction;
  categoryOptions: string[];
  paymentMethodOptions: string[];
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (input: TransactionFormValues) => void;
}) {
  const [form, setForm] = useState<TransactionFormValues>(getDefaults(initialValue));
  const [error, setError] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(["Food", "Housing", "Bills", "Travel", "Shopping", "Salary", ...categoryOptions])),
    [categoryOptions]
  );
  const paymentMethods = useMemo(
    () => Array.from(new Set(["UPI", "Bank", "Card", "Cash", ...paymentMethodOptions])),
    [paymentMethodOptions]
  );

  function setValue<K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      return setError("Please enter a title.");
    }
    if (!form.category.trim()) {
      return setError("Please choose or type a category.");
    }
    if (!form.paymentMethod.trim()) {
      return setError("Please enter a payment method.");
    }
    if (!form.amount || form.amount <= 0) {
      return setError("Amount must be more than zero.");
    }
    setError("");
    onSubmit({
      ...form,
      title: form.title.trim(),
      category: form.category.trim(),
      paymentMethod: form.paymentMethod.trim(),
      notes: form.notes?.trim() ?? ""
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell label="Date">
          <InputField
            type="date"
            value={form.date}
            onChange={(event) => setValue("date", event.target.value)}
          />
        </FieldShell>
        <FieldShell label="Type">
          <SelectField
            value={form.type}
            onChange={(event) => setValue("type", event.target.value as Transaction["type"])}
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </SelectField>
        </FieldShell>
        <FieldShell label="Title" className="sm:col-span-2">
          <InputField
            value={form.title}
            placeholder="Salary credited, Groceries, Client payment"
            onChange={(event) => setValue("title", event.target.value)}
          />
        </FieldShell>
        <FieldShell label="Category">
          <InputField
            list="transaction-categories"
            value={form.category}
            onChange={(event) => setValue("category", event.target.value)}
          />
          <datalist id="transaction-categories">
            {categories.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </FieldShell>
        <FieldShell label="Payment method">
          <InputField
            list="transaction-payment-methods"
            value={form.paymentMethod}
            onChange={(event) => setValue("paymentMethod", event.target.value)}
          />
          <datalist id="transaction-payment-methods">
            {paymentMethods.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </FieldShell>
        <FieldShell label="Amount">
          <InputField
            type="number"
            min="0"
            value={form.amount || ""}
            onChange={(event) => setValue("amount", Number(event.target.value))}
          />
        </FieldShell>
        <FieldShell label="Notes">
          <TextareaField
            rows={4}
            value={form.notes ?? ""}
            onChange={(event) => setValue("notes", event.target.value)}
          />
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
