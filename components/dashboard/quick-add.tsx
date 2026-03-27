"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldShell, InputField, SelectField, TextareaField } from "@/components/ui/form-controls";
import { getTodayIso } from "@/lib/formatters";
import { usePocketFlow, usePocketFlowOptions } from "@/lib/pocketflow-store";
import { cn } from "@/lib/utils";

const tabs = ["Transaction", "Lend/Borrow", "Investment", "Asset"] as const;
type Tab = (typeof tabs)[number];

const freshDefaults = () => ({
  Transaction: {
    date: getTodayIso(),
    type: "expense",
    title: "",
    category: "Food",
    amount: "",
    paymentMethod: "UPI",
    notes: ""
  },
  "Lend/Borrow": {
    date: getTodayIso(),
    person: "",
    kind: "given",
    amount: "",
    settled: "",
    dueDate: "",
    notes: ""
  },
  Investment: {
    date: getTodayIso(),
    investmentType: "Mutual Fund",
    platform: "Groww",
    investedAmount: "",
    currentValue: "",
    withdrawnAmount: "",
    notes: ""
  },
  Asset: {
    date: getTodayIso(),
    assetName: "",
    assetCategory: "Electronics",
    purchaseCost: "",
    currentValue: "",
    notes: ""
  }
});

export function QuickAdd() {
  const [activeTab, setActiveTab] = useState<Tab>("Transaction");
  const [formState, setFormState] = useState(freshDefaults());
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const { addAsset, addInvestment, addLendBorrowEntry, addTransaction } = usePocketFlow();
  const { categories, paymentMethods, investmentPlatforms, investmentTypes, assetCategories } = usePocketFlowOptions();

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
    const defaults = freshDefaults();
    setFormState((prev) => ({
      ...prev,
      [activeTab]: defaults[activeTab]
    }));
  };

  const showMessage = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 2400);
  };

  const fail = (message: string) => {
    setError(message);
    setTimeout(() => setError(""), 2400);
  };

  const handleSubmit = () => {
    setError("");

    if (activeTab === "Transaction") {
      const data = formState.Transaction;
      if (!data.title.trim() || !data.amount) return fail("Add title and amount first.");
      addTransaction({
        date: data.date,
        type: data.type as "income" | "expense",
        title: data.title.trim(),
        category: data.category.trim(),
        amount: Number(data.amount),
        paymentMethod: data.paymentMethod.trim(),
        notes: data.notes.trim()
      });
      resetCurrentTab();
      return showMessage("Transaction added to dashboard.");
    }

    if (activeTab === "Lend/Borrow") {
      const data = formState["Lend/Borrow"];
      if (!data.person.trim() || !data.amount) return fail("Add person and amount first.");
      addLendBorrowEntry({
        date: data.date,
        person: data.person.trim(),
        type: data.kind as "given" | "borrowed",
        amount: Number(data.amount),
        amountSettled: Number(data.settled || 0),
        dueDate: data.dueDate || undefined,
        notes: data.notes.trim()
      });
      resetCurrentTab();
      return showMessage("Lend / borrow entry added.");
    }

    if (activeTab === "Investment") {
      const data = formState.Investment;
      if (!data.investedAmount || !data.currentValue) {
        return fail("Add invested amount and current value first.");
      }
      addInvestment({
        date: data.date,
        investmentType: data.investmentType.trim(),
        platform: data.platform.trim(),
        investedAmount: Number(data.investedAmount),
        currentValue: Number(data.currentValue),
        withdrawnAmount: Number(data.withdrawnAmount || 0),
        notes: data.notes.trim()
      });
      resetCurrentTab();
      return showMessage("Investment saved.");
    }

    const data = formState.Asset;
    if (!data.assetName.trim() || !data.currentValue) {
      return fail("Add asset name and current value first.");
    }
    addAsset({
      date: data.date,
      assetName: data.assetName.trim(),
      assetCategory: data.assetCategory.trim(),
      purchaseCost: Number(data.purchaseCost || 0),
      currentValue: Number(data.currentValue),
      notes: data.notes.trim()
    });
    resetCurrentTab();
    showMessage("Asset added.");
  };

  const links = useMemo(
    () => ({
      Transaction: "/transactions",
      "Lend/Borrow": "/lend-borrow",
      Investment: "/investments",
      Asset: "/assets"
    }),
    []
  );

  const transactionValues = formState.Transaction;
  const lendBorrowValues = formState["Lend/Borrow"];
  const investmentValues = formState.Investment;
  const assetValues = formState.Asset;

  return (
    <Card className="p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xl font-semibold">Quick Add</p>
          <p className="mt-1 text-sm text-muted">
            Save real entries locally and jump to the full page when you need deeper control.
          </p>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          {success ? (
            <div className="rounded-full border border-success/30 bg-success/10 px-4 py-2 text-sm text-success">
              {success}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-full border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
              {error}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-[22px] border border-white/8 bg-white/[0.03] p-1 md:grid-cols-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-2xl px-3 py-3 text-sm font-medium transition",
              tab === activeTab
                ? "bg-primary text-black"
                : "text-muted hover:bg-white/5 hover:text-white"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Transaction" ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <FieldShell label="Date">
            <InputField type="date" value={transactionValues.date} onChange={(event) => setValue("date", event.target.value)} />
          </FieldShell>
          <FieldShell label="Type">
            <SelectField value={transactionValues.type} onChange={(event) => setValue("type", event.target.value)}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </SelectField>
          </FieldShell>
          <FieldShell label="Title" className="sm:col-span-2">
            <InputField value={transactionValues.title} onChange={(event) => setValue("title", event.target.value)} />
          </FieldShell>
          <FieldShell label="Category">
            <InputField list="quickadd-categories" value={transactionValues.category} onChange={(event) => setValue("category", event.target.value)} />
            <datalist id="quickadd-categories">
              {categories.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </FieldShell>
          <FieldShell label="Amount">
            <InputField type="number" value={transactionValues.amount} onChange={(event) => setValue("amount", event.target.value)} />
          </FieldShell>
          <FieldShell label="Payment method">
            <InputField list="quickadd-payment-methods" value={transactionValues.paymentMethod} onChange={(event) => setValue("paymentMethod", event.target.value)} />
            <datalist id="quickadd-payment-methods">
              {paymentMethods.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </FieldShell>
          <FieldShell label="Notes" className="sm:col-span-2">
            <TextareaField rows={4} value={transactionValues.notes} onChange={(event) => setValue("notes", event.target.value)} />
          </FieldShell>
        </div>
      ) : null}

      {activeTab === "Lend/Borrow" ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <FieldShell label="Date">
            <InputField type="date" value={lendBorrowValues.date} onChange={(event) => setValue("date", event.target.value)} />
          </FieldShell>
          <FieldShell label="Type">
            <SelectField value={lendBorrowValues.kind} onChange={(event) => setValue("kind", event.target.value)}>
              <option value="given">Given</option>
              <option value="borrowed">Borrowed</option>
            </SelectField>
          </FieldShell>
          <FieldShell label="Person / company" className="sm:col-span-2">
            <InputField value={lendBorrowValues.person} onChange={(event) => setValue("person", event.target.value)} />
          </FieldShell>
          <FieldShell label="Amount">
            <InputField type="number" value={lendBorrowValues.amount} onChange={(event) => setValue("amount", event.target.value)} />
          </FieldShell>
          <FieldShell label="Amount settled">
            <InputField type="number" value={lendBorrowValues.settled} onChange={(event) => setValue("settled", event.target.value)} />
          </FieldShell>
          <FieldShell label="Due date">
            <InputField type="date" value={lendBorrowValues.dueDate} onChange={(event) => setValue("dueDate", event.target.value)} />
          </FieldShell>
          <FieldShell label="Notes" className="sm:col-span-2">
            <TextareaField rows={4} value={lendBorrowValues.notes} onChange={(event) => setValue("notes", event.target.value)} />
          </FieldShell>
        </div>
      ) : null}

      {activeTab === "Investment" ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <FieldShell label="Date">
            <InputField type="date" value={investmentValues.date} onChange={(event) => setValue("date", event.target.value)} />
          </FieldShell>
          <FieldShell label="Investment type">
            <InputField list="quickadd-investment-types" value={investmentValues.investmentType} onChange={(event) => setValue("investmentType", event.target.value)} />
            <datalist id="quickadd-investment-types">
              {investmentTypes.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </FieldShell>
          <FieldShell label="Platform / broker">
            <InputField list="quickadd-investment-platforms" value={investmentValues.platform} onChange={(event) => setValue("platform", event.target.value)} />
            <datalist id="quickadd-investment-platforms">
              {investmentPlatforms.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </FieldShell>
          <FieldShell label="Invested amount">
            <InputField type="number" value={investmentValues.investedAmount} onChange={(event) => setValue("investedAmount", event.target.value)} />
          </FieldShell>
          <FieldShell label="Current value">
            <InputField type="number" value={investmentValues.currentValue} onChange={(event) => setValue("currentValue", event.target.value)} />
          </FieldShell>
          <FieldShell label="Withdrawn amount">
            <InputField type="number" value={investmentValues.withdrawnAmount} onChange={(event) => setValue("withdrawnAmount", event.target.value)} />
          </FieldShell>
          <FieldShell label="Notes" className="sm:col-span-2">
            <TextareaField rows={4} value={investmentValues.notes} onChange={(event) => setValue("notes", event.target.value)} />
          </FieldShell>
        </div>
      ) : null}

      {activeTab === "Asset" ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <FieldShell label="Date">
            <InputField type="date" value={assetValues.date} onChange={(event) => setValue("date", event.target.value)} />
          </FieldShell>
          <FieldShell label="Asset name">
            <InputField value={assetValues.assetName} onChange={(event) => setValue("assetName", event.target.value)} />
          </FieldShell>
          <FieldShell label="Asset category">
            <InputField list="quickadd-asset-categories" value={assetValues.assetCategory} onChange={(event) => setValue("assetCategory", event.target.value)} />
            <datalist id="quickadd-asset-categories">
              {assetCategories.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </FieldShell>
          <FieldShell label="Purchase cost">
            <InputField type="number" value={assetValues.purchaseCost} onChange={(event) => setValue("purchaseCost", event.target.value)} />
          </FieldShell>
          <FieldShell label="Current value">
            <InputField type="number" value={assetValues.currentValue} onChange={(event) => setValue("currentValue", event.target.value)} />
          </FieldShell>
          <FieldShell label="Notes" className="sm:col-span-2">
            <TextareaField rows={4} value={assetValues.notes} onChange={(event) => setValue("notes", event.target.value)} />
          </FieldShell>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted">
          Need filters, edits, or deeper summaries? Open the full page for this section.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={links[activeTab]}>
            <Button variant="secondary">Open full {activeTab} page</Button>
          </Link>
          <Button onClick={handleSubmit}>Save {activeTab}</Button>
        </div>
      </div>
    </Card>
  );
}
