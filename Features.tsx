const FEATURES = [
  { title: "Smart reorder recommendations", desc: "Know exactly which products need a reorder before they run out — with the quantity and timing already worked out.", color: "#EF5B5B" },
  { title: "Auto-drafted purchase orders", desc: "One click turns your reorder list into ready-to-send purchase orders, grouped by supplier with quantities and cost.", color: "#4FD1C5" },
  { title: "Dead stock & overstock alerts", desc: "See where capital is tied up in slow-moving inventory, and by how much.", color: "#9B8CFF" },
  { title: "Demand forecasting & trends", desc: "8–12 week forecasts per product, plus early flags on demand shifts before they show up in revenue.", color: "#F5A623" },
  { title: "Festival-aware forecasting", desc: "Diwali, Holi, Raksha Bandhan and more — checked against your own sales history, not a generic calendar.", color: "#F5A623" },
  { title: "AI chat assistant", desc: "Ask 'what should I reorder' or 'why did sales drop' and get answers grounded in your own data.", color: "#EF5B5B" },
];

export default function Features() {
  return (
    <section id="features" className="max-w-5xl mx-auto px-6 py-20 border-b border-line">
      <h2 className="font-display text-2xl font-semibold text-center mb-1">Built for how retailers actually decide</h2>
      <p className="text-muted text-sm text-center mb-12">Four capabilities, one continuous read on your business.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl bg-panel border border-line p-6 hover:border-line/60 transition">
            <div className="w-8 h-1 rounded-full mb-4" style={{ backgroundColor: f.color }} />
            <h3 className="font-display font-semibold text-base mb-2">{f.title}</h3>
            <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
