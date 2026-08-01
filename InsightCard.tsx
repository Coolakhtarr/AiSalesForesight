const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  trend_up: { label: "Trending up", color: "text-signal-teal border-signal-teal/30 bg-signal-teal/10" },
  trend_down: { label: "Trending down", color: "text-signal-coral border-signal-coral/30 bg-signal-coral/10" },
  promo_impact: { label: "Promotion impact", color: "text-signal-amber border-signal-amber/30 bg-signal-amber/10" },
  elasticity: { label: "Price sensitivity", color: "text-signal-violet border-signal-violet/30 bg-signal-violet/10" },
  rebalance: { label: "Stock rebalance", color: "text-signal-amber border-signal-amber/30 bg-signal-amber/10" },
  hidden_gem: { label: "Hidden gem", color: "text-signal-teal border-signal-teal/30 bg-signal-teal/10" },
  cannibalization: { label: "Cannibalization", color: "text-signal-coral border-signal-coral/30 bg-signal-coral/10" },
};

export default function InsightCard({
  type,
  productName,
  message,
}: {
  type: string;
  productName?: string;
  message: string;
}) {
  const cfg = TYPE_CONFIG[type] ?? { label: type, color: "text-muted border-line bg-panel2" };

  return (
    <div className="rounded-xl bg-panel border border-line p-4">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
        {productName && <span className="text-xs text-muted font-mono">{productName}</span>}
      </div>
      <p className="text-sm text-foreground leading-snug">{message}</p>
    </div>
  );
}
