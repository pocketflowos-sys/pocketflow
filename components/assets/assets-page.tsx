"use client";

import { useMemo, useState } from "react";
import { Download, Package, PencilLine, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AssetForm } from "@/components/assets/asset-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldShell, InputField, SelectField } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SummaryCard } from "@/components/ui/summary-card";
import { downloadCsv, getAssetChange, getAssetChangePercent } from "@/lib/finance";
import { formatCompactDate, formatCurrency } from "@/lib/formatters";
import { usePocketFlow, usePocketFlowOptions } from "@/lib/pocketflow-store";
import type { Asset } from "@/lib/types";

const defaultFilters = {
  search: "",
  category: "all"
};

export function AssetsPage() {
  const { state, addAsset, updateAsset, deleteAsset } = usePocketFlow();
  const { assetCategories } = usePocketFlowOptions();
  const [filters, setFilters] = useState(defaultFilters);
  const [editingItem, setEditingItem] = useState<Asset | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const rows = useMemo(() => {
    return [...state.assets]
      .map((item) => {
        const change = getAssetChange(item.currentValue, item.purchaseCost);
        const changePercent = getAssetChangePercent(item.currentValue, item.purchaseCost);
        return { ...item, change, changePercent };
      })
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .filter((item) => {
        const searchTarget = `${item.assetName} ${item.assetCategory} ${item.notes ?? ""}`.toLowerCase();
        const matchesSearch = filters.search ? searchTarget.includes(filters.search.toLowerCase()) : true;
        const matchesCategory = filters.category === "all" ? true : item.assetCategory === filters.category;
        return matchesSearch && matchesCategory;
      });
  }, [filters, state.assets]);

  const summary = useMemo(() => {
    const totalPurchase = rows.reduce((sum, item) => sum + item.purchaseCost, 0);
    const totalCurrent = rows.reduce((sum, item) => sum + item.currentValue, 0);
    const totalChange = rows.reduce((sum, item) => sum + item.change, 0);
    return { totalPurchase, totalCurrent, totalChange };
  }, [rows]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof rows>();
    rows.forEach((item) => {
      const current = map.get(item.assetCategory) ?? [];
      map.set(item.assetCategory, [...current, item]);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  function exportRows() {
    downloadCsv(
      "pocketflow-assets.csv",
      ["Date", "Asset Name", "Category", "Purchase Cost", "Current Value", "Change", "Change %", "Notes"],
      rows.map((item) => [item.date, item.assetName, item.assetCategory, item.purchaseCost, item.currentValue, item.change, item.changePercent.toFixed(2), item.notes ?? ""])
    );
  }

  function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this asset entry?");
    if (confirmed) deleteAsset(id);
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Phase 4"
        title="Assets"
        description="Track owned items, current value, category grouping, and value appreciation or depreciation."
        actions={
          <>
            <Button variant="secondary" className="gap-2" onClick={exportRows}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add asset
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Purchase value" value={formatCurrency(summary.totalPurchase, state.userSettings.currency)} detail="What you originally paid" tone="gold" icon={<Package className="h-5 w-5" />} />
        <SummaryCard title="Current value" value={formatCurrency(summary.totalCurrent, state.userSettings.currency)} detail="Estimated current worth" tone="green" />
        <SummaryCard title="Change" value={formatCurrency(summary.totalChange, state.userSettings.currency)} detail="Appreciation or depreciation" tone={summary.totalChange >= 0 ? "green" : "red"} />
        <SummaryCard title="Assets tracked" value={String(rows.length)} detail="Filtered asset count" />
      </section>

      <Card className="mt-6 p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldShell label="Search">
            <InputField value={filters.search} placeholder="Bike, MacBook, camera" onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))} />
          </FieldShell>
          <FieldShell label="Category">
            <SelectField value={filters.category} onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}>
              <option value="all">All</option>
              {assetCategories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </SelectField>
          </FieldShell>
        </div>
      </Card>

      <section className="mt-6 grid gap-6">
        {grouped.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-lg font-semibold">No assets found</p>
            <p className="mt-2 text-sm text-muted">Adjust the filters or add a new asset.</p>
          </Card>
        ) : null}

        {grouped.map(([category, items]) => (
          <Card key={category} className="p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xl font-semibold">{category}</p>
                <p className="mt-1 text-sm text-muted">{items.length} assets in this group</p>
              </div>
              <Badge tone="neutral">Grouped view</Badge>
            </div>

            <div className="mt-5 grid gap-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold">{item.assetName}</p>
                        <Badge tone={item.change >= 0 ? "green" : "red"}>{item.changePercent.toFixed(1)}%</Badge>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p>Purchase cost</p>
                          <p className="mt-1 font-semibold text-white">{formatCurrency(item.purchaseCost, state.userSettings.currency)}</p>
                        </div>
                        <div>
                          <p>Current value</p>
                          <p className="mt-1 font-semibold text-white">{formatCurrency(item.currentValue, state.userSettings.currency)}</p>
                        </div>
                        <div>
                          <p>Change</p>
                          <p className={`mt-1 font-semibold ${item.change >= 0 ? "text-success" : "text-danger"}`}>{formatCurrency(item.change, state.userSettings.currency)}</p>
                        </div>
                        <div>
                          <p>Added</p>
                          <p className="mt-1 font-semibold text-white">{formatCompactDate(item.date)}</p>
                        </div>
                      </div>

                      {item.notes ? <p className="mt-4 text-sm text-muted">{item.notes}</p> : null}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row xl:flex-col xl:items-stretch">
                      <Button variant="secondary" className="gap-2" onClick={() => setEditingItem(item)}>
                        <PencilLine className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="secondary" className="gap-2 text-danger hover:border-danger/30" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add asset" description="Save a new asset with value details.">
        <AssetForm
          categoryOptions={assetCategories}
          submitLabel="Save asset"
          onCancel={() => setCreateOpen(false)}
          onSubmit={(input) => {
            addAsset(input);
            setCreateOpen(false);
          }}
        />
      </Modal>

      <Modal open={Boolean(editingItem)} onClose={() => setEditingItem(null)} title="Edit asset" description="Update value, category, or notes.">
        {editingItem ? (
          <AssetForm
            initialValue={editingItem}
            categoryOptions={assetCategories}
            submitLabel="Update asset"
            onCancel={() => setEditingItem(null)}
            onSubmit={(input) => {
              updateAsset(editingItem.id, input);
              setEditingItem(null);
            }}
          />
        ) : null}
      </Modal>
    </AppShell>
  );
}
