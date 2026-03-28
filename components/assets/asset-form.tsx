"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldShell, InputField, SelectField, TextareaField } from "@/components/ui/form-controls";
import { getTodayIso } from "@/lib/formatters";
import type { Asset } from "@/lib/types";

type AssetFormValues = Omit<Asset, "id">;

function getDefaults(item?: Asset): AssetFormValues {
  return {
    date: item?.date ?? getTodayIso(),
    assetName: item?.assetName ?? "",
    assetCategory: item?.assetCategory ?? "Electronics",
    purchaseCost: item?.purchaseCost ?? 0,
    currentValue: item?.currentValue ?? 0,
    notes: item?.notes ?? ""
  };
}

export function AssetForm({
  initialValue,
  categoryOptions,
  submitLabel,
  onCancel,
  onSubmit
}: {
  initialValue?: Asset;
  categoryOptions: string[];
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (input: AssetFormValues) => Promise<boolean> | void;
}) {
  const [form, setForm] = useState<AssetFormValues>(getDefaults(initialValue));
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!form.assetName.trim()) return setError("Please enter an asset name.");
    if (!form.assetCategory.trim()) return setError("Please enter an asset category.");
    if (form.currentValue < 0) return setError("Current value cannot be negative.");
    if (form.purchaseCost < 0) return setError("Purchase cost cannot be negative.");
    setError("");
    onSubmit({
      ...form,
      assetName: form.assetName.trim(),
      assetCategory: form.assetCategory.trim(),
      notes: form.notes?.trim() ?? ""
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell label="Date">
          <InputField type="date" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} />
        </FieldShell>
        <FieldShell label="Asset name">
          <InputField value={form.assetName} onChange={(event) => setForm((prev) => ({ ...prev, assetName: event.target.value }))} />
        </FieldShell>
        <FieldShell label="Asset category">
          <SelectField value={form.assetCategory} onChange={(event) => setForm((prev) => ({ ...prev, assetCategory: event.target.value }))}>
            {categoryOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectField>
        </FieldShell>
        <FieldShell label="Purchase cost">
          <InputField type="number" min="0" value={form.purchaseCost || ""} onChange={(event) => setForm((prev) => ({ ...prev, purchaseCost: Number(event.target.value) }))} />
        </FieldShell>
        <FieldShell label="Current value">
          <InputField type="number" min="0" value={form.currentValue || ""} onChange={(event) => setForm((prev) => ({ ...prev, currentValue: Number(event.target.value) }))} />
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
