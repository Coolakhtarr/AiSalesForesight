"use client";

import { useMemo, useState } from "react";
import RiskBadge, { RiskStatus } from "@/components/ui/RiskBadge";
import { createClient } from "@/lib/supabaseClient";

export type ProductRow = {
  id: string;
  name: string;
  category: string | null;
  status: RiskStatus;
  avgDailyDemand: number;
  revenueAtRisk: number;
  capitalLocked: number;
  supplierId: string | null;
};

export type SupplierOption = { id: string; name: string };

const FILTERS: { label: string; value: RiskStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Reorder now", value: "reorder_now" },
  { label: "At risk", value: "at_risk" },
  { label: "Healthy", value: "healthy" },
  { label: "Overstock", value: "overstock" },
];

type SortKey = "revenueAtRisk" | "capitalLocked" | "avgDailyDemand";

export default function ProductsTable({ rows, suppliers }: { rows: ProductRow[]; suppliers: SupplierOption[] }) {
  const [filter, setFilter] = useState<RiskStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("revenueAtRisk");
  const [assignments, setAssignments] = useState<Record<string, string | null>>(
    Object.fromEntries(rows.map((r) => [r.id, r.supplierId]))
  );
  const supabase = createClient();

  async function assignSupplier(productId: string, supplierId: string) {
    setAssignments((prev) => ({ ...prev, [productId]: supplierId || null }));
    await supabase.from("products").update({ supplier_id: supplierId || null }).eq("id", productId);
  }

  const filtered = useMemo(() => {
    const base = filter === "all" ? rows : rows.filter((r) => r.status === filter);
    return [...base].sort((a, b) => b[sortKey] - a[sortKey]);
  }, [rows, filter, sortKey]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filter === f.value
                  ? "bg-panel2 border-line text-foreground"
                  : "border-line text-muted hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="bg-panel2 border border-line rounded-lg text-xs px-2.5 py-1.5 text-muted"
        >
          <option value="revenueAtRisk">Sort by revenue at risk</option>
          <option value="capitalLocked">Sort by capital locked</option>
          <option value="avgDailyDemand">Sort by daily demand</option>
        </select>
      </div>

      <div className="rounded-xl border border-line overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-panel2 text-muted text-xs uppercase tracking-wide">
              <th className="text-left font-medium px-4 py-3">Product</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="text-left font-medium px-4 py-3">Supplier</th>
              <th className="text-right font-medium px-4 py-3">Daily demand</th>
              <th className="text-right font-medium px-4 py-3">Revenue at risk</th>
              <th className="text-right font-medium px-4 py-3">Capital locked</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t border-line hover:bg-panel2/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium">{row.name}</div>
                  {row.category && <div className="text-xs text-muted">{row.category}</div>}
                </td>
                <td className="px-4 py-3">
                  <RiskBadge status={row.status} />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={assignments[row.id] ?? ""}
                    onChange={(e) => assignSupplier(row.id, e.target.value)}
                    className="bg-panel2 border border-line rounded-lg text-xs px-2 py-1 text-muted"
                  >
                    <option value="">Unassigned</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right font-mono">{row.avgDailyDemand.toFixed(1)}</td>
                <td className="px-4 py-3 text-right font-mono">
                  ₹{Math.round(row.revenueAtRisk).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  ₹{Math.round(row.capitalLocked).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted text-sm">
                  No products match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
