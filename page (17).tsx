import AppShell from "@/components/layout/AppShell";
import InsightCard from "@/components/insights/InsightCard";
import ElasticityScatter from "@/components/insights/ElasticityScatter";
import WhatIfSimulator from "@/components/insights/WhatIfSimulator";
import { createServerClient } from "@/lib/supabaseServer";

export default async function InsightsPage() {
  const supabase = createServerClient();

  const { data: insights } = await supabase
    .from("analytics_insights")
    .select("id,type,message,metrics_json,products(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  const byType = (t: string) => (insights || []).filter((i) => i.type === t);

  const elasticityPoints = byType("elasticity")
    .map((i: any) => {
      const m = i.metrics_json || {};
      if (m.price == null || m.quantity == null) return null;
      return {
        productName: i.products?.name ?? "",
        price: m.price,
        quantity: m.quantity,
        elasticity: m.elasticity ?? 0,
      };
    })
    .filter(Boolean) as any[];

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold">Insights</h1>
        <p className="text-sm text-muted mt-1">
          Patterns AiSalesForesight found on its own — trends, promotions, pricing, and products
          worth a second look.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="font-display text-sm font-semibold mb-3">Demand trends</h2>
          <div className="space-y-3">
            {[...byType("trend_up"), ...byType("trend_down")].length === 0 && <EmptyNote label="trends" />}
            {[...byType("trend_up"), ...byType("trend_down")].map((i: any) => (
              <InsightCard key={i.id} type={i.type} productName={i.products?.name} message={i.message} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-sm font-semibold mb-3">Promotion impact</h2>
          <div className="space-y-3">
            {byType("promo_impact").length === 0 && <EmptyNote label="promotions" />}
            {byType("promo_impact").map((i: any) => (
              <InsightCard key={i.id} type={i.type} productName={i.products?.name} message={i.message} />
            ))}
          </div>
        </section>

        <section className="lg:col-span-2">
          <h2 className="font-display text-sm font-semibold mb-3">Price sensitivity</h2>
          <div className="rounded-xl bg-panel border border-line p-5">
            <ElasticityScatter points={elasticityPoints} />
          </div>
        </section>

        <section className="lg:col-span-2">
          <h2 className="font-display text-sm font-semibold mb-3">What-if price simulator</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {elasticityPoints.slice(0, 2).map((p, i) => (
              <WhatIfSimulator
                key={i}
                productName={p.productName || "Product"}
                currentPrice={p.price}
                currentQuantity={p.quantity}
                elasticity={p.elasticity}
              />
            ))}
            {elasticityPoints.length === 0 && <EmptyNote label="products with enough price history to simulate" />}
          </div>
        </section>

        <section>
          <h2 className="font-display text-sm font-semibold mb-3">Bundle & cross-sell ideas</h2>
          <div className="space-y-3">
            {byType("bundle").length === 0 && <EmptyNote label="bundle opportunities" />}
            {byType("bundle").map((i: any) => (
              <InsightCard key={i.id} type={i.type} productName={i.products?.name} message={i.message} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-sm font-semibold mb-3">Festival watch</h2>
          <div className="space-y-3">
            {byType("festival_watch").length === 0 && <EmptyNote label="upcoming festival demand spikes" />}
            {byType("festival_watch").map((i: any) => (
              <InsightCard key={i.id} type={i.type} productName={i.products?.name} message={i.message} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-sm font-semibold mb-3">Stock rebalancing</h2>
          <div className="space-y-3">
            {byType("rebalance").length === 0 && <EmptyNote label="rebalancing suggestions" />}
            {byType("rebalance").map((i: any) => (
              <InsightCard key={i.id} type={i.type} productName={i.products?.name} message={i.message} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-sm font-semibold mb-3">Hidden gems</h2>
          <div className="space-y-3">
            {byType("hidden_gem").length === 0 && <EmptyNote label="hidden gems" />}
            {byType("hidden_gem").map((i: any) => (
              <InsightCard key={i.id} type={i.type} productName={i.products?.name} message={i.message} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function EmptyNote({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">
      No {label} detected yet — this fills in after your next analytics refresh.
    </div>
  );
}
