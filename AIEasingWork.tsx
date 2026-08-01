const COMPARISONS = [
  {
    before: "Manually scanning spreadsheets to guess what's running low",
    after: "AI scores every product's stock risk automatically, every day",
  },
  {
    before: "Calling or messaging suppliers with a hand-typed order list",
    after: "AI drafts the purchase order — quantities, cost, reasoning — ready to send",
  },
  {
    before: "Finding out about a stockout when a customer complains",
    after: "AI flags it 1–2 weeks ahead, based on your own sales pattern",
  },
  {
    before: "Guessing whether a discount actually helped or just gave away margin",
    after: "AI compares promo vs non-promo weeks and tells you the real answer",
  },
  {
    before: "Missing festival demand spikes because they're not in a generic model",
    after: "AI checks India's festival calendar against your own history, per product",
  },
  {
    before: "Never knowing which products sell well together",
    after: "AI finds real co-purchase patterns and suggests bundles worth trying",
  },
];

export default function AIEasingWork() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-20 border-b border-line">
      <h2 className="font-display text-2xl font-semibold text-center mb-1">
        What AI actually takes off your plate
      </h2>
      <p className="text-muted text-sm text-center mb-12">
        Not a chatbot bolted onto a dashboard — work that used to take hours, done automatically.
      </p>
      <div className="space-y-3">
        {COMPARISONS.map((c) => (
          <div
            key={c.before}
            className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-line bg-panel p-4"
          >
            <p className="text-sm text-muted line-through decoration-signal-coral/50">{c.before}</p>
            <span className="text-signal-teal text-xs font-mono justify-self-center">→</span>
            <p className="text-sm text-foreground font-medium">{c.after}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
