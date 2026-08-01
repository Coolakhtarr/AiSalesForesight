import AppShell from "@/components/layout/AppShell";
import KpiCard from "@/components/ui/KpiCard";
import ActionCenter, { ActionItem } from "@/components/dashboard/ActionCenter";
import ForecastChart from "@/components/charts/ForecastChart";
import { createServerClient } from "@/lib/supabaseServer";

// Server component: fetch RLS-scoped data directly via the Supabase server client.
export default async function DashboardPage() {
  const supabase = createServerClient();

  const [{ data: risk }, { data: forecasts }, { data: org }] = await Promise.all([
    supabase
      .from("inventory_insights")
      .select("id,product_id,status,revenue_at_risk,capital_locked,avg_daily_demand,products(name)")
      .order("revenue_at_risk", { ascending: false })
      .limit(8),
    supabase.from("forecasts").select("date,predicted_qty").order("date").limit(56),
    supabase.from("organizations").select("name").single(),
  ]);

  const totalRevenueAtRisk = (risk || []).reduce((sum, r) => sum + (r.revenue_at_risk || 0), 0);
  const totalOverstockValue = (risk || [])
    .filter((r) => r.status === "overstock")
    .reduce((sum, r) => sum + (r.capital_locked || 0), 0);

  const actionItems: ActionItem[] = (risk || [])
    .filter((r) => r.status === "reorder_now" || r.status === "at_risk")
    .slice(0, 6)
    .map((r: any) => ({
      id: r.id,
      productName: r.products?.name ?? "Unknown product",
      status: r.status,
      detail: `${Math.round(r.avg_daily_demand || 0)} units/day average demand`,
      metric: `₹${Math.round(r.revenue_at_risk || 0).toLocaleString("en-IN")} at risk`,
    }));

  return (
    <AppShell orgName={org?.name ?? "Your Store"} plan="trial">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted mt-1">A running view of what needs attention and what's ahead.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KpiCard
          label="Revenue at risk"
          value={`₹${Math.round(totalRevenueAtRisk).toLocaleString("en-IN")}`}
          delta="From stockout-risk products"
          deltaTone="negative"
          color="#EF5B5B"
        />
        <KpiCard
          label="Capital in overstock"
          value={`₹${Math.round(totalOverstockValue).toLocaleString("en-IN")}`}
          delta="Tied up in slow-moving stock"
          deltaTone="neutral"
          color="#9B8CFF"
        />
        <KpiCard
          label="Products tracked"
          value={`${(risk || []).length}`}
          delta="Scored in the last refresh"
          deltaTone="positive"
          color="#4FD1C5"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl bg-panel border border-line shadow-card p-5">
          <h2 className="font-display text-sm font-semibold mb-4">Actual vs. forecasted demand</h2>
          <ForecastChart data={forecasts || []} />
        </div>
        <div>
          <h2 className="font-display text-sm font-semibold mb-4">Action Center</h2>
          <ActionCenter items={actionItems} />
        </div>
      </div>
    </AppShell>
  );
}
