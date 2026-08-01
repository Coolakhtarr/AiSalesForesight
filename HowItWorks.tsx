const STEPS = [
  { n: "01", title: "Upload your sales data", desc: "A CSV or Excel export is enough — date, product, quantity, price. Inventory is optional but unlocks more." },
  { n: "02", title: "We prepare and analyze it", desc: "Data is cleaned, structured, and run through forecasting and risk models automatically." },
  { n: "03", title: "Get dashboards & AI recommendations", desc: "See what to reorder, what to discount, and what's trending — and ask the assistant why." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20 border-b border-line">
      <h2 className="font-display text-2xl font-semibold text-center mb-1">How it works</h2>
      <p className="text-muted text-sm text-center mb-12">From a raw export to a working forecast in minutes.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {STEPS.map((s) => (
          <div key={s.n}>
            <div className="font-mono text-signal-teal text-sm mb-3">{s.n}</div>
            <h3 className="font-display font-semibold text-base mb-2">{s.title}</h3>
            <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
