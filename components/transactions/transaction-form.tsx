"use client";

import { useMemo, useState } from "react";
import { Paperclip, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComboField, FieldShell, InputField, SelectField, TextareaField } from "@/components/ui/form-controls";
import { getTodayIso } from "@/lib/formatters";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { createTransactionProofSignedUrl, formatFileSize } from "@/lib/transaction-proofs";
import type { Transaction, TransactionMutationInput } from "@/lib/types";

type TransactionFormValues = Omit<TransactionMutationInput, "proofFile" | "removeProof">;

function getDefaults(transaction?: Transaction): TransactionFormValues {
  return {
    date: transaction?.date ?? getTodayIso(),
    type: transaction?.type ?? "expense",
    title: transaction?.title ?? "",
    category: transaction?.category ?? "",
    amount: transaction?.amount ?? 0,
    paymentMethod: transaction?.paymentMethod ?? "",
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
  onSubmit: (input: TransactionMutationInput) => Promise<boolean> | void;
}) {
  const [form, setForm] = useState<TransactionFormValues>(getDefaults(initialValue));
  const [error, setError] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [removeProof, setRemoveProof] = useState(false);
  const existingProof = useMemo(() => {
    if (!initialValue?.proofStoragePath || !initialValue?.proofFileName) return null;
    return {
      proofStoragePath: initialValue.proofStoragePath,
      proofFileName: initialValue.proofFileName,
      proofMimeType: initialValue.proofMimeType
    };
  }, [initialValue]);

  async function openExistingProof() {
    if (!existingProof?.proofStoragePath) return;
    try {
      const supabase = createBrowserSupabaseClient();
      const signedUrl = await createTransactionProofSignedUrl(supabase, existingProof.proofStoragePath);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch {
      setError("Could not open the saved proof file.");
    }
  }

  function handleProofFileChange(file: File | null) {
    if (!file) return;
    const isAllowed = file.type.startsWith("image/") || file.type === "application/pdf";
    if (!isAllowed) return setError("Attach an image, screenshot, or PDF proof file.");
    if (file.size > 10 * 1024 * 1024) return setError("Keep the proof file under 10 MB.");
    setError("");
    setProofFile(file);
    setRemoveProof(false);
  }

  async function handleSubmit() {
    if (!form.title.trim()) return setError("Please enter a title.");
    if (!form.category.trim()) return setError("Please enter a category.");
    if (!form.paymentMethod.trim()) return setError("Please enter a payment method.");
    if (!form.amount || form.amount <= 0) return setError("Amount must be more than zero.");
    setError("");
    const saved = await onSubmit({
      ...form,
      title: form.title.trim(),
      category: form.category.trim(),
      paymentMethod: form.paymentMethod.trim(),
      notes: form.notes?.trim() ?? "",
      proofFile,
      removeProof,
      proofStoragePath: removeProof ? undefined : existingProof?.proofStoragePath,
      proofFileName: removeProof ? undefined : existingProof?.proofFileName,
      proofMimeType: removeProof ? undefined : existingProof?.proofMimeType
    });
    if (saved === false) {
      setError("We could not save this transaction. Please check the fields and try again.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell label="Date">
          <InputField type="date" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} />
        </FieldShell>
        <FieldShell label="Type">
          <SelectField value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as Transaction["type"] }))}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </SelectField>
        </FieldShell>
        <FieldShell label="Title" className="sm:col-span-2">
          <InputField value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
        </FieldShell>
        <FieldShell label="Category">
          <ComboField options={categoryOptions} value={form.category} placeholder="Select or type a category" onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} />
        </FieldShell>
        <FieldShell label="Payment method">
          <ComboField options={paymentMethodOptions} value={form.paymentMethod} placeholder="Select or type a payment method" onChange={(event) => setForm((prev) => ({ ...prev, paymentMethod: event.target.value }))} />
        </FieldShell>
        <FieldShell label="Amount">
          <InputField type="number" min="0" value={form.amount || ""} onChange={(event) => setForm((prev) => ({ ...prev, amount: Number(event.target.value) }))} />
        </FieldShell>
        <FieldShell label="Notes" className="sm:col-span-2">
          <TextareaField rows={4} value={form.notes ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
        </FieldShell>

        <FieldShell label="Transaction proof" className="sm:col-span-2">
          <div className="space-y-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-white">Attach bill, screenshot, or PDF</p>
                <p className="mt-1 text-xs text-muted">Useful for keeping food bills, fuel receipts, and other transaction proof files.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:border-primary/30">
                <Upload className="h-4 w-4" />
                Choose file
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(event) => { handleProofFileChange(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} />
              </label>
            </div>

            {proofFile ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary"><Paperclip className="h-4 w-4" /></div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{proofFile.name}</p>
                    <p className="mt-1 text-xs text-muted">{formatFileSize(proofFile.size)} • {proofFile.type || "Proof file"}</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" className="justify-center gap-2 self-start text-muted hover:text-white" onClick={() => setProofFile(null)}>
                  <X className="h-4 w-4" />Remove
                </Button>
              </div>
            ) : null}

            {!proofFile && existingProof && !removeProof ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary"><Paperclip className="h-4 w-4" /></div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{existingProof.proofFileName}</p>
                    <p className="mt-1 text-xs text-muted">Saved proof attachment</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="secondary" onClick={() => void openExistingProof()}>Open proof</Button>
                  <Button type="button" variant="ghost" className="gap-2 text-muted hover:text-white" onClick={() => setRemoveProof(true)}>
                    <X className="h-4 w-4" />Remove
                  </Button>
                </div>
              </div>
            ) : null}

            {!proofFile && removeProof ? (
              <div className="flex items-center justify-between rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                <span>Saved proof will be removed when you save this transaction.</span>
                <Button type="button" variant="ghost" className="text-white hover:text-white" onClick={() => setRemoveProof(false)}>Undo</Button>
              </div>
            ) : null}
          </div>
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
