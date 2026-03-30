"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Plus, Trash2, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldShell, InputField, SelectField } from "@/components/ui/form-controls";
import { PageHeader } from "@/components/ui/page-header";
import { PdfExportButton } from "@/components/ui/pdf-export-button";
import { usePocketFlow } from "@/lib/pocketflow-store";

function SettingsCountCard({ title, value, detail, tone = "neutral" }: { title: string; value: string; detail: string; tone?: "neutral" | "green" | "gold"; }) {
  return (
    <Card className="h-full rounded-[22px] p-4 md:rounded-[26px] md:p-5">
      <p className="text-[11px] text-muted md:text-xs">{title}</p>
      <p className="mt-2 text-2xl font-semibold md:text-3xl">{value}</p>
      <p
        className={`mt-1.5 text-[11px] leading-4 md:text-sm ${
          tone === "green" ? "text-success" : tone === "gold" ? "text-primary" : "text-muted"
        }`}
      >
        {detail}
      </p>
    </Card>
  );
}

function ListManager({ title, description, items, placeholder, onSave }: { title: string; description: string; items: string[]; placeholder: string; onSave: (nextItems: string[]) => Promise<boolean> | void; }) {
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
    <Card className="rounded-[22px] p-4 md:rounded-[26px] md:p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted">{description}</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <InputField value={draft} placeholder={placeholder} onChange={(event) => setDraft(event.target.value)} />
        <Button className="w-full gap-2 sm:w-auto" onClick={addItem}><Plus className="h-4 w-4" />Add</Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm">
            <span>{item}</span>
            <button onClick={() => removeItem(item)} className="text-danger"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CollapsibleSection({ title, description, children, defaultOpen = false }: { title: string; description: string; children: React.ReactNode; defaultOpen?: boolean; }) {
  return (
    <details className="group overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03] open:bg-white/[0.04] md:rounded-[28px]" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3.5 md:px-5 md:py-4">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold md:text-lg">{title}</p>
          <p className="mt-1 text-[11px] leading-4 text-muted md:text-sm">{description}</p>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-180" />
      </summary>
      <div className="border-t border-white/8 px-3.5 py-3.5 md:px-5 md:py-5">{children}</div>
    </details>
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

  const managerCounts = useMemo(() => ({
    categories: state.userSettings.categories.length,
    paymentMethods: state.userSettings.paymentMethods.length,
    investmentTypes: state.userSettings.investmentTypes.length,
    assetCategories: state.userSettings.assetCategories.length
  }), [state.userSettings]);

  async function saveProfile() {
    const didSave = await updateUserSettings({ profileName: profileName.trim(), email: email.trim(), supportEmail: supportEmail.trim() });
    if (!didSave) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl px-0">
        <div className="mb-4 space-y-3 md:hidden">
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary/90">Workspace settings</p>
            <h2 className="text-xl font-semibold">Settings</h2>
            <p className="text-xs leading-5 text-muted">Manage preferences, theme, and your custom lists in a cleaner mobile layout.</p>
          </div>
          <div>
            <PdfExportButton />
          </div>
        </div>

        <div className="hidden md:block">
          <PageHeader compact eyebrow="Workspace settings" title="Settings" description="Manage preferences, theme, and all custom lists in a cleaner mobile layout." actions={<PdfExportButton />} />
        </div>

        <section className="mt-1 grid grid-cols-2 gap-3 md:mt-0 md:grid-cols-2 xl:grid-cols-4">
          <SettingsCountCard title="Categories" value={String(managerCounts.categories)} detail="Transactions and budgets" tone="gold" />
          <SettingsCountCard title="Payment methods" value={String(managerCounts.paymentMethods)} detail="Forms and filters" />
          <SettingsCountCard title="Investment types" value={String(managerCounts.investmentTypes)} detail="Portfolio options" tone="green" />
          <SettingsCountCard title="Asset categories" value={String(managerCounts.assetCategories)} detail="Asset views" />
        </section>

        <section className="mt-4 space-y-4 md:mt-6">
          <CollapsibleSection defaultOpen title="Profile & preferences" description="Saved to your account and synced across devices.">
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <Card className="rounded-[22px] p-4 md:rounded-[26px] md:p-6">
                <div className="flex items-center gap-3"><div className="rounded-2xl bg-primary/15 p-3 text-primary"><UserRound className="h-5 w-5" /></div><div className="min-w-0"><h3 className="text-lg font-semibold">Profile</h3><p className="mt-1 text-sm text-muted">Account details used across the workspace.</p></div></div>
                <div className="mt-5 grid gap-4">
                  <FieldShell label="Profile name"><InputField value={profileName} onChange={(event) => setProfileName(event.target.value)} /></FieldShell>
                  <FieldShell label="Email"><InputField type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></FieldShell>
                  <p className="-mt-2 text-xs text-muted">If you change your email, you may need to confirm the new address before it becomes fully active.</p>
                  <FieldShell label="Support email"><InputField type="email" value={supportEmail} onChange={(event) => setSupportEmail(event.target.value)} /></FieldShell>
                  <FieldShell label="Preferred currency"><SelectField value={state.userSettings.currency} onChange={(event) => { void updateUserSettings({ currency: event.target.value }); }}><option value="INR">INR</option><option value="USD">USD</option><option value="AED">AED</option><option value="GBP">GBP</option></SelectField></FieldShell>
                </div>
                <div className="mt-5 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3"><Button onClick={() => void saveProfile()}>Save profile</Button>{saved ? <span className="text-sm text-success">Saved</span> : <span className="text-sm text-muted">Your changes update the whole workspace.</span>}</div>
              </Card>

              <Card className="rounded-[22px] p-4 md:rounded-[26px] md:p-6">
                <h3 className="text-lg font-semibold">Theme</h3>
                <p className="mt-1 text-sm text-muted">Choose the premium dark or premium white workspace theme.</p>
                <div className="mt-5 grid gap-3">
                  <button onClick={() => { void updateUserSettings({ theme: "dark" }); }} className={`rounded-[24px] border p-4 text-left transition ${state.userSettings.theme === "dark" ? "border-primary bg-primary/10" : "border-white/10 bg-[#0d1017]"}`}>
                    <p className="font-semibold">Premium dark</p>
                    <p className="mt-1 text-sm text-muted">Trustworthy dark black workspace.</p>
                  </button>
                  <button onClick={() => { void updateUserSettings({ theme: "light" }); }} className={`rounded-[24px] border p-4 text-left transition ${state.userSettings.theme === "light" ? "border-primary bg-primary/10" : "border-white/10 bg-white text-slate-900"}`}>
                    <p className="font-semibold">Premium white</p>
                    <p className="mt-1 text-sm text-muted">Clean bright workspace for daytime use.</p>
                  </button>
                </div>
                <a href={`mailto:${state.userSettings.supportEmail}`} className="mt-5 inline-flex text-sm text-primary">Contact support</a>
              </Card>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Custom categories & lists" description="Users can type new values in forms, and you can manage the master lists here.">
            <div className="grid gap-4 md:gap-6 md:grid-cols-2">
              <ListManager title="Categories" description="Used in transaction and budget forms." items={state.userSettings.categories} placeholder="Add Food, Salary, Health" onSave={(items) => updateUserSettings({ categories: items })} />
              <ListManager title="Payment methods" description="Used in transactions and filters." items={state.userSettings.paymentMethods} placeholder="Add Wallet, Bank Transfer" onSave={(items) => updateUserSettings({ paymentMethods: items })} />
              <ListManager title="Investment types" description="Used in investments page and Quick Add." items={state.userSettings.investmentTypes} placeholder="Add ETF, Bond" onSave={(items) => updateUserSettings({ investmentTypes: items })} />
              <ListManager title="Investment platforms" description="Used for brokers, apps, and banks." items={state.userSettings.investmentPlatforms} placeholder="Add Upstox, Kuvera" onSave={(items) => updateUserSettings({ investmentPlatforms: items })} />
              <ListManager title="Asset categories" description="Used across assets and Quick Add." items={state.userSettings.assetCategories} placeholder="Add Machinery, Furniture" onSave={(items) => updateUserSettings({ assetCategories: items })} />
            </div>
          </CollapsibleSection>
        </section>
      </div>
    </AppShell>
  );
}
