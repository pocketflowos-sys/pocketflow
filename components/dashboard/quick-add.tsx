"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Paperclip, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ComboField, FieldShell, InputField, TextareaField } from "@/components/ui/form-controls";
import { getTodayIso } from "@/lib/formatters";
import { usePocketFlow, usePocketFlowOptions } from "@/lib/pocketflow-store";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/transaction-proofs";

const tabs = ["Transaction", "Lend/Borrow", "Investment", "Asset"] as const;
type Tab = (typeof tabs)[number];

type QuickAddPreset = {
  transactionType?: "income" | "expense";
  category?: string;
  lendBorrowType?: "given" | "borrowed";
  investmentType?: string;
  assetCategory?: string;
};

type QuickAddOptions = {
  categories: string[];
  paymentMethods: string[];
  investmentPlatforms: string[];
  investmentTypes: string[];
  assetCategories: string[];
};

function firstOrFallback(values: string[], fallback: string) {
  return values[0] ?? fallback;
}

function buildDefaults(options: QuickAddOptions, preset?: QuickAddPreset) {
  return {
    Transaction: {
      date: getTodayIso(),
      type: preset?.transactionType ?? "expense",
      title: "",
      category: preset?.category ?? "",
      amount: "",
      paymentMethod: "",
      notes: ""
    },
    "Lend/Borrow": {
      date: getTodayIso(),
      person: "",
      kind: preset?.lendBorrowType ?? "given",
      amount: "",
      settled: "",
      dueDate: "",
      notes: ""
    },
    Investment: {
      date: getTodayIso(),
      investmentType: preset?.investmentType ?? firstOrFallback(options.investmentTypes, "Mutual Fund"),
      platform: firstOrFallback(options.investmentPlatforms, "Groww"),
      investedAmount: "",
      currentValue: "",
      withdrawnAmount: "",
      notes: ""
    },
    Asset: {
      date: getTodayIso(),
      assetName: "",
      assetCategory: preset?.assetCategory ?? firstOrFallback(options.assetCategories, "Electronics"),
      purchaseCost: "",
      currentValue: "",
      notes: ""
    }
  };
}

function ChoiceChips<T extends string>({
  value,
  onChange,
  options,
  columns = 2
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; helper?: string }>;
  columns?: 2 | 3;
}) {
  return (
    <div className={cn("grid gap-2", columns === 3 ? "grid-cols-3" : "grid-cols-2")}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-2xl border px-4 py-3 text-left transition",
              active
                ? "border-primary/50 bg-primary text-black shadow-[0_10px_30px_rgba(247,199,51,0.18)]"
                : "border-white/10 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.06]"
            )}
            aria-pressed={active}
          >
            <div className="text-sm font-semibold">{option.label}</div>
            {option.helper ? (
              <div className={cn("mt-1 text-xs", active ? "text-black/70" : "text-muted")}>
                {option.helper}
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function QuickAdd({
  initialTab = "Transaction" as Tab,
  compact = false,
  preset,
  onSuccess
}: {
  initialTab?: Tab;
  compact?: boolean;
  preset?: QuickAddPreset;
  onSuccess?: () => void;
} = {}) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const { addAsset, addInvestment, addLendBorrowEntry, addTransaction, operationError, clearOperationError } = usePocketFlow();
  const { categories, paymentMethods, investmentPlatforms, investmentTypes, assetCategories } = usePocketFlowOptions();
  const optionState = useMemo(
    () => ({ categories, paymentMethods, investmentPlatforms, investmentTypes, assetCategories }),
    [assetCategories, categories, investmentPlatforms, investmentTypes, paymentMethods]
  );
  const [formState, setFormState] = useState(() => buildDefaults(optionState, preset));
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [transactionProofFile, setTransactionProofFile] = useState<File | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      ...buildDefaults(optionState, preset)
    }));
  }, [optionState, preset]);

  useEffect(() => {
    if (!operationError) return;
    setError(operationError);
  }, [operationError]);

  const setValue = (name: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [name]: value
      }
    }));
  };

  const resetCurrentTab = () => {
    const defaults = buildDefaults(optionState, preset);
    setFormState((prev) => ({
      ...prev,
      [activeTab]: defaults[activeTab]
    }));
    if (activeTab === "Transaction") {
      clearTransactionProof();
    }
  };

  const showMessage = (message: string) => {
    clearOperationError();
    setError("");
    setSuccess(message);
    setTimeout(() => setSuccess(""), 2400);
  };

  const fail = (message: string) => {
    setSuccess("");
    setError(message);
    setTimeout(() => setError(""), 3200);
  };

  const handleProofFileChange = (file: File | null) => {
    if (!file) return;
    const isAllowed = file.type.startsWith("image/") || file.type === "application/pdf";
    if (!isAllowed) {
      fail("Attach an image, screenshot, or PDF proof file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      fail("Keep the proof file under 10 MB.");
      return;
    }
    setTransactionProofFile(file);
  };

  const clearTransactionProof = () => {
    setTransactionProofFile(null);
  };

  const handleSubmit = async () => {
    clearOperationError();
    setError("");

    if (activeTab === "Transaction") {
      const data = formState.Transaction;
      if (!data.title.trim() || !data.amount) return fail("Add title and amount first.");
      const saved = await addTransaction({
        date: data.date,
        type: data.type as "income" | "expense",
        title: data.title.trim(),
        category: data.category.trim(),
        amount: Number(data.amount),
        paymentMethod: data.paymentMethod.trim(),
        notes: data.notes.trim(),
        proofFile: transactionProofFile
      });
      if (!saved) return fail(operationError || "We could not save this transaction.");
      resetCurrentTab();
      clearTransactionProof();
      showMessage(transactionProofFile ? "Transaction and proof saved." : "Transaction added.");
      onSuccess?.();
      return;
    }

    if (activeTab === "Lend/Borrow") {
      const data = formState["Lend/Borrow"];
      if (!data.person.trim() || !data.amount) return fail("Add person and amount first.");
      const saved = await addLendBorrowEntry({
        date: data.date,
        person: data.person.trim(),
        type: data.kind as "given" | "borrowed",
        amount: Number(data.amount),
        amountSettled: Number(data.settled || 0),
        dueDate: data.dueDate || undefined,
        notes: data.notes.trim()
      });
      if (!saved) return fail(operationError || "We could not save this lend / borrow entry.");
      resetCurrentTab();
      showMessage("Lend / borrow entry added.");
      onSuccess?.();
      return;
    }

    if (activeTab === "Investment") {
      const data = formState.Investment;
      if (!data.investedAmount || !data.currentValue) {
        return fail("Add invested amount and current value first.");
      }
      const saved = await addInvestment({
        date: data.date,
        investmentType: data.investmentType.trim(),
        platform: data.platform.trim(),
        investedAmount: Number(data.investedAmount),
        currentValue: Number(data.currentValue),
        withdrawnAmount: Number(data.withdrawnAmount || 0),
        notes: data.notes.trim()
      });
      if (!saved) return fail(operationError || "We could not save this investment.");
      resetCurrentTab();
      showMessage("Investment saved.");
      onSuccess?.();
      return;
    }

    const data = formState.Asset;
    if (!data.assetName.trim() || !data.currentValue) {
      return fail("Add asset name and current value first.");
    }
    const saved = await addAsset({
      date: data.date,
      assetName: data.assetName.trim(),
      assetCategory: data.assetCategory.trim(),
      purchaseCost: Number(data.purchaseCost || 0),
      currentValue: Number(data.currentValue),
      notes: data.notes.trim()
    });
    if (!saved) return fail(operationError || "We could not save this asset.");
    resetCurrentTab();
    showMessage("Asset added.");
    onSuccess?.();
  };

  const links: Record<Tab, Route> = {
    Transaction: "/transactions",
    "Lend/Borrow": "/lend-borrow",
    Investment: "/investments",
    Asset: "/assets"
  };

  const transactionValues = formState.Transaction;
  const lendBorrowValues = formState["Lend/Borrow"];
  const investmentValues = formState.Investment;
  const assetValues = formState.Asset;

  return (
    <Card className={compact ? "p-4" : "p-4 md:p-6"}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xl font-semibold">Quick Add</p>
          <p className="mt-1 text-sm text-muted">Save entries fast, then open the full page whenever you need deeper control.</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-[22px] border border-white/8 bg-white/[0.03] p-1 md:grid-cols-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-2xl px-3 py-3 text-sm font-medium transition",
              tab === activeTab ? "bg-primary text-black" : "text-muted hover:bg-white/5 hover:text-white"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {activeTab === "Transaction" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldShell label="Date"><InputField type="date" value={transactionValues.date} onChange={(event) => setValue("date", event.target.value)} /></FieldShell>
              <FieldShell label="Type">
                <ChoiceChips
                  value={transactionValues.type as "income" | "expense"}
                  onChange={(value) => setValue("type", value)}
                  options={[
                    { value: "income", label: "Income", helper: "Money coming in" },
                    { value: "expense", label: "Expense", helper: "Money going out" }
                  ]}
                />
              </FieldShell>
              <FieldShell label="Title" className="sm:col-span-2"><InputField value={transactionValues.title} onChange={(event) => setValue("title", event.target.value)} /></FieldShell>
              <FieldShell label="Category"><ComboField options={categories} value={transactionValues.category} placeholder="Select or type a category" onChange={(event) => setValue("category", event.target.value)} /></FieldShell>
              <FieldShell label="Payment method"><ComboField options={paymentMethods} value={transactionValues.paymentMethod} placeholder="Select or type a payment method" onChange={(event) => setValue("paymentMethod", event.target.value)} /></FieldShell>
              <FieldShell label="Amount"><InputField type="number" min="0" value={transactionValues.amount} onChange={(event) => setValue("amount", event.target.value)} /></FieldShell>
              <FieldShell label="Notes" className="sm:col-span-2"><TextareaField rows={3} value={transactionValues.notes} onChange={(event) => setValue("notes", event.target.value)} /></FieldShell>
            </div>
            <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium">Attach transaction proof</p>
                  <p className="mt-1 text-sm text-muted">Add a food bill photo, fuel receipt, screenshot, or PDF for future reference.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:border-primary/30">
                  <Upload className="h-4 w-4" />
                  Choose file
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(event) => { handleProofFileChange(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} />
                </label>
              </div>
              {transactionProofFile ? (
                <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary"><Paperclip className="h-4 w-4" /></div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{transactionProofFile.name}</p>
                      <p className="mt-1 text-xs text-muted">{formatFileSize(transactionProofFile.size)} • {transactionProofFile.type || "Proof file"}</p>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" className="justify-center gap-2 self-start text-muted hover:text-white" onClick={clearTransactionProof}>
                    <X className="h-4 w-4" />Remove
                  </Button>
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        {activeTab === "Lend/Borrow" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldShell label="Date"><InputField type="date" value={lendBorrowValues.date} onChange={(event) => setValue("date", event.target.value)} /></FieldShell>
            <FieldShell label="Type">
              <ChoiceChips
                value={lendBorrowValues.kind as "given" | "borrowed"}
                onChange={(value) => setValue("kind", value)}
                options={[
                  { value: "given", label: "Given", helper: "Money to receive" },
                  { value: "borrowed", label: "Borrowed", helper: "Money to repay" }
                ]}
              />
            </FieldShell>
            <FieldShell label="Person / place"><InputField value={lendBorrowValues.person} onChange={(event) => setValue("person", event.target.value)} /></FieldShell>
            <FieldShell label="Amount"><InputField type="number" min="0" value={lendBorrowValues.amount} onChange={(event) => setValue("amount", event.target.value)} /></FieldShell>
            <FieldShell label="Settled amount"><InputField type="number" min="0" value={lendBorrowValues.settled} onChange={(event) => setValue("settled", event.target.value)} /></FieldShell>
            <FieldShell label="Due date"><InputField type="date" value={lendBorrowValues.dueDate} onChange={(event) => setValue("dueDate", event.target.value)} /></FieldShell>
            <FieldShell label="Notes" className="sm:col-span-2"><TextareaField rows={3} value={lendBorrowValues.notes} onChange={(event) => setValue("notes", event.target.value)} /></FieldShell>
          </div>
        ) : null}

        {activeTab === "Investment" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldShell label="Date"><InputField type="date" value={investmentValues.date} onChange={(event) => setValue("date", event.target.value)} /></FieldShell>
            <FieldShell label="Investment type"><ComboField options={investmentTypes} value={investmentValues.investmentType} onChange={(event) => setValue("investmentType", event.target.value)} /></FieldShell>
            <FieldShell label="Platform"><ComboField options={investmentPlatforms} value={investmentValues.platform} onChange={(event) => setValue("platform", event.target.value)} /></FieldShell>
            <FieldShell label="Invested amount"><InputField type="number" min="0" value={investmentValues.investedAmount} onChange={(event) => setValue("investedAmount", event.target.value)} /></FieldShell>
            <FieldShell label="Current value"><InputField type="number" min="0" value={investmentValues.currentValue} onChange={(event) => setValue("currentValue", event.target.value)} /></FieldShell>
            <FieldShell label="Withdrawn amount"><InputField type="number" min="0" value={investmentValues.withdrawnAmount} onChange={(event) => setValue("withdrawnAmount", event.target.value)} /></FieldShell>
            <FieldShell label="Notes" className="sm:col-span-2"><TextareaField rows={3} value={investmentValues.notes} onChange={(event) => setValue("notes", event.target.value)} /></FieldShell>
          </div>
        ) : null}

        {activeTab === "Asset" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldShell label="Date"><InputField type="date" value={assetValues.date} onChange={(event) => setValue("date", event.target.value)} /></FieldShell>
            <FieldShell label="Asset name"><InputField value={assetValues.assetName} onChange={(event) => setValue("assetName", event.target.value)} /></FieldShell>
            <FieldShell label="Asset category"><ComboField options={assetCategories} value={assetValues.assetCategory} onChange={(event) => setValue("assetCategory", event.target.value)} /></FieldShell>
            <FieldShell label="Purchase cost"><InputField type="number" min="0" value={assetValues.purchaseCost} onChange={(event) => setValue("purchaseCost", event.target.value)} /></FieldShell>
            <FieldShell label="Current value"><InputField type="number" min="0" value={assetValues.currentValue} onChange={(event) => setValue("currentValue", event.target.value)} /></FieldShell>
            <FieldShell label="Notes" className="sm:col-span-2"><TextareaField rows={3} value={assetValues.notes} onChange={(event) => setValue("notes", event.target.value)} /></FieldShell>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Link href={links[activeTab]} className="text-sm text-primary">Open full {activeTab.toLowerCase()} page</Link>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" onClick={resetCurrentTab}>Reset</Button>
            <Button onClick={() => void handleSubmit()}>Save now</Button>
          </div>
          {success ? <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success sm:max-w-[320px]">{success}</div> : null}
          {error ? <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger sm:max-w-[320px]">{error}</div> : null}
        </div>
      </div>
    </Card>
  );
}
