import AppShell from "@/components/layout/AppShell";
import ProductsTable, { ProductRow } from "@/components/products/ProductsTable";
import { createServerClient } from "@/lib/supabaseServer";

export default async function ProductsPage() {
  const supabase = createServerClient();

  const { data } = await supabase
    .from("inventory_insights")
    .select("id,product_id,status,avg_daily_demand,revenue_at_risk,capital_locked,products(name,category,supplier_id)");

  const { data: suppliers } = await supabase.from("suppliers").select("id,name").order("name");

  const rows: ProductRow[] = (data || []).map((r: any) => ({
    id: r.product_id,
    name: r.products?.name ?? "Unknown product",
    category: r.products?.category ?? null,
    status: r.status,
    avgDailyDemand: r.avg_daily_demand || 0,
    revenueAtRisk: r.revenue_at_risk || 0,
    capitalLocked: r.capital_locked || 0,
    supplierId: r.products?.supplier_id ?? null,
  }));

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold">Products</h1>
        <p className="text-sm text-muted mt-1">
          {rows.length} products scored in the last refresh. Filter by status, sort, or assign a supplier.
        </p>
      </div>
      <ProductsTable rows={rows} suppliers={suppliers || []} />
    </AppShell>
  );
}
