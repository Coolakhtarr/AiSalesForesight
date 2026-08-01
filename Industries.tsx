const INDUSTRIES = [
  {
    name: "Retail chains & general trade",
    fit: "Strong fit",
    pitch: "Every SKU across every store scored for reorder risk automatically — stop losing sales to empty shelves during your busiest hours.",
  },
  {
    name: "E-commerce & D2C brands",
    fit: "Strong fit",
    pitch: "Know which products to restock before a Shopify bestseller goes out of stock mid-campaign, and which ones are quietly bleeding ad spend on dead inventory.",
  },
  {
    name: "Distributors & wholesalers",
    fit: "Strong fit",
    pitch: "Manage hundreds of SKUs across multiple warehouses with automatic stock-rebalancing suggestions instead of manual spreadsheet reconciliation.",
  },
  {
    name: "Pharmacy & grocery chains",
    fit: "Strong fit",
    pitch: "Perishables and fast-moving essentials punish stockouts hardest — get ahead of demand shifts before they cost you a customer relationship.",
  },
  {
    name: "F&B chains & restaurant supply",
    fit: "Strong fit",
    pitch: "Forecast ingredient and packaging demand per outlet, and catch festival-driven spikes (a real feature here, not an afterthought) before they catch you.",
  },
  {
    name: "Manufacturing (finished goods & spares)",
    fit: "Strong fit",
    pitch: "Apply the same forecasting engine to finished-goods and spare-parts inventory — reduce working capital tied up in warehouse stock.",
  },
  {
    name: "Electronics & auto-parts retailers",
    fit: "Strong fit",
    pitch: "High-value, slow-turning SKUs are exactly where overstock alerts save the most capital — see it before it becomes a clearance sale.",
  },
  {
    name: "Hospitality (F&B & housekeeping supplies)",
    fit: "Good fit — for supplies, not room revenue",
    pitch: "Track kitchen and housekeeping inventory the same way a retailer tracks shelf stock — this isn't a room-pricing tool, but it fits the supply side well.",
  },
];

export default function Industries() {
  return (
    <section id="industries" className="max-w-5xl mx-auto px-6 py-20 border-b border-line">
      <h2 className="font-display text-2xl font-semibold text-center mb-1">Built for businesses that hold inventory</h2>
      <p className="text-muted text-sm text-center mb-3 max-w-2xl mx-auto">
        If your business buys, stocks, and sells physical products — in any quantity, in any country —
        this is built for you. Both B2B and B2C.
      </p>
      <p className="text-muted text-xs text-center mb-12 max-w-xl mx-auto">
        Honest note: we're not a fit for businesses that don't hold SKU-level inventory — pure
        services, IT consulting, or real estate sales don't have the "product + quantity + stock"
        shape this engine is built around. If that's you, this probably isn't the right tool yet.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {INDUSTRIES.map((ind) => (
          <div key={ind.name} className="rounded-xl bg-panel border border-line p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-semibold text-sm">{ind.name}</h3>
              <span className="text-[10px] font-mono uppercase tracking-wide text-signal-teal border border-signal-teal/30 rounded-full px-2 py-0.5 shrink-0 ml-2">
                {ind.fit}
              </span>
            </div>
            <p className="text-xs text-muted leading-relaxed">{ind.pitch}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
