import KpiCard from "@/components/ui/KpiCard";
import RiskBadge from "@/components/ui/RiskBadge";

export default function DashboardPreview() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-20 border-b border-line">
      <div className="text-center mb-10">
        <h2 className="font-display text-2xl font-semibold mb-1">See it before you upload anything</h2>
        <p className="text-muted text-sm">This is a live preview of the dashboard you'll get on day one.</p>
      </div>

      <div className="rounded-2xl border border-line bg-panel/60 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <KpiCard label="Revenue at risk" value="₹42,300" delta="12 products flagged" deltaTone="negative" color="#EF5B5B" sparkline={{ actual: [30, 34, 31, 38, 42], forecast: [45, 48, 44] }} />
          <KpiCard label="Capital in overstock" value="₹1,18,000" delta="5 slow movers" deltaTone="neutral" color="#9B8CFF" sparkline={{ actual: [80, 95, 100, 110, 118], forecast: [122, 119, 121] }} />
          <KpiCard label="Forecast accuracy" value="91.2%" delta="Last 8 weeks" deltaTone="positive" color="#4FD1C5" sparkline={{ actual: [86, 88, 89, 90, 91], forecast: [91, 92, 92] }} />
        </div>
        <div className="rounded-xl border border-line bg-panel divide-y divide-line">
          {[
            { name: "Organic Cotton Tee — Navy", status: "reorder_now" as const, note: "6 days of stock left" },
            { name: "Ceramic Mug Set", status: "overstock" as const, note: "₹18,400 tied up" },
            { name: "Bamboo Cutting Board", status: "healthy" as const, note: "On track" },
          ].map((r) => (
            <div key={r.name} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <RiskBadge status={r.status} />
                <span className="text-sm">{r.name}</span>
              </div>
              <span className="text-xs text-muted font-mono">{r.note}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
