"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldShell, InputField, SelectField } from "@/components/ui/form-controls";
import { PageHeader } from "@/components/ui/page-header";
import { PdfExportButton } from "@/components/ui/pdf-export-button";
import { SummaryCard } from "@/components/ui/summary-card";
import { usePocketFlow } from "@/lib/pocketflow-store";

function ListManager({
  title,
  description,
  items,
  placeholder,
  onSave
}: {
  title: string;
  description: string;
  items: string[];
  placeholder: string;
  onSave: (nextItems: string[]) => Promise<boolean> | void;
}) {
  const [draft, setDraft] = useState("");

  async function addItem() {
    const next = draft.trim();
    if (!next) return;
    if (items.some((item) => item.toLowerCase() === next.toLowerCase())) {
      setDraft("");
      return;
    }
    const saved = await onSave([...items, next].sort((a, b) => a.localeCompare(b)));
    if (saved !== false) setDraft("");
  }

  async function removeItem(itemToRemove: string) {
    await onSave(items.filter((item) => item !== itemToRemove));
  }

  return (
    <Card className="p-5 md:p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted">{description}</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <InputField value={draft} placeholder={placeholder} onChange={(event) => setDraft(event.target.value)} />
        <Button className="gap-2" onClick={addItem}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm">
            <span>{item}</span>
            <button onClick={() => removeItem(item)} className="text-danger">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function SettingsPage() {
  const { state, updateUserSettings } = usePocketFlow();
  const [profileName, setProfileName] = useState(state.userSettings.profileName);
  const [email, setEmail] = useState(state.userSettings.email);
  const [supportEmail, setSupportEmail] = useState(state.userSettings.supportEmail);
  const [saved, setSaved] = useState(false);


  useEffect(() => {
    setProfileName(state.userSettings.profileName);
    setEmail(state.userSettings.email);
    setSupportEmail(state.userSettings.supportEmail);
  }, [state.userSettings.profileName, state.userSettings.email, state.userSettings.supportEmail]);

  const managerCounts = useMemo(
    () => ({
      categories: state.userSettings.categories.length,
      paymentMethods: state.userSettings.paymentMethods.length,
      investmentTypes: state.userSettings.investmentTypes.length,
      assetCategories: state.userSettings.assetCategories.length
    }),
    [state.userSettings]
  );

  async function saveProfile() {
    const didSave = await updateUserSettings({ profileName: profileName.trim(), email: email.trim(), supportEmail: supportEmail.trim() });
    if (!didSave) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <AppShell>
      <PageHeader
        compact
        eyebrow="Workspace settings"
        title="Settings"
        description="Manage the defaults that power Quick Add and every full page across your live workspace."
        actions={<PdfExportButton />}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Categories" value={String(managerCounts.categories)} detail="Available for transactions and budgets" tone="gold" />
        <SummaryCard title="Payment methods" value={String(managerCounts.paymentMethods)} detail="Used in forms and filters" />
        <SummaryCard title="Investment types" value={String(managerCounts.investmentTypes)} detail="Portfolio structure options" tone="green" />
        <SummaryCard title="Asset categories" value={String(managerCounts.assetCategories)} detail="Used across asset views" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <Card className="p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/15 p-3 text-primary">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Profile & preferences</h3>
              <p className="mt-1 text-sm text-muted">Saved to your account settings.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <FieldShell label="Profile name">
              <InputField value={profileName} onChange={(event) => setProfileName(event.target.value)} />
            </FieldShell>
            <FieldShell label="Email">
              <InputField type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </FieldShell>
            <p className="-mt-2 text-xs text-muted">If you change your email, Supabase may ask you to confirm the new address before it becomes fully active.</p>
            <FieldShell label="Support email">
              <InputField type="email" value={supportEmail} onChange={(event) => setSupportEmail(event.target.value)} />
            </FieldShell>
            <FieldShell label="Preferred currency">
              <SelectField value={state.userSettings.currency} onChange={(event) => { void updateUserSettings({ currency: event.target.value }); }}>
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="AED">AED</option>
                <option value="GBP">GBP</option>
              </SelectField>
            </FieldShell>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Button onClick={() => void saveProfile()}>Save profile</Button>
            {saved ? <span className="text-sm text-success">Saved</span> : <span className="text-sm text-muted">Your choices update the whole workspace.</span>}
          </div>
        </Card>

        <Card className="p-5 md:p-6">
          <h3 className="text-lg font-semibold">Implementation note</h3>
          <div className="mt-4 space-y-3 text-sm text-muted">
            <p>These settings now drive dropdown choices across transactions, budgets, investments, assets, and Quick Add.</p>
            <p>These settings are already wired to Supabase and stay user-specific across devices.</p>
            <p>These controls now feed the synced data layer used across your account.</p>
          </div>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <ListManager
          title="Categories"
          description="Used in transaction and budget forms."
          items={state.userSettings.categories}
          placeholder="Add Food, Salary, Health"
          onSave={(items) => updateUserSettings({ categories: items })}
        />
        <ListManager
          title="Payment methods"
          description="Used in transactions and filters."
          items={state.userSettings.paymentMethods}
          placeholder="Add Wallet, Bank Transfer"
          onSave={(items) => updateUserSettings({ paymentMethods: items })}
        />
        <ListManager
          title="Investment types"
          description="Used in investments page and Quick Add."
          items={state.userSettings.investmentTypes}
          placeholder="Add ETF, Bond"
          onSave={(items) => updateUserSettings({ investmentTypes: items })}
        />
        <ListManager
          title="Investment platforms"
          description="Used for brokers, apps, and banks."
          items={state.userSettings.investmentPlatforms}
          placeholder="Add Upstox, Kuvera"
          onSave={(items) => updateUserSettings({ investmentPlatforms: items })}
        />
        <ListManager
          title="Asset categories"
          description="Used across assets and Quick Add."
          items={state.userSettings.assetCategories}
          placeholder="Add Machinery, Furniture"
          onSave={(items) => updateUserSettings({ assetCategories: items })}
        />
      </section>
    </AppShell>
  );
}
