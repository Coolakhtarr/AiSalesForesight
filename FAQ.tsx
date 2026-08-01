"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  { q: "What exactly does AiSalesForesight do?", a: "It turns your past sales (and optional stock) data into forecasts, inventory risk alerts, and an AI assistant that recommends what to reorder, discount, or investigate — all from one upload." },
  { q: "What data do I need to start?", a: "A CSV or Excel export with date, product, quantity sold, and price. Stock levels and multiple locations are optional but unlock more features." },
  { q: "Do I need to know ML or data science?", a: "No. Upload your file; the platform cleans it, runs the models, and explains results in plain language, both in dashboards and in chat." },
  { q: "How does the AI chat assistant work?", a: "It reads your organization's own forecasts and insights — never other businesses' data — and answers your question grounded strictly in that data." },
  { q: "What kinds of insights can I expect?", a: "Demand forecasts per product, reorder and overstock alerts, early trend detection, promotion and pricing impact, and multi-location rebalancing on Pro." },
  { q: "How often are forecasts updated?", a: "Basic plans refresh weekly; Pro plans refresh daily via scheduled background jobs." },
  { q: "Is my data safe and private?", a: "Yes — each organization's data is isolated at the database level using row-level security, so no other account can ever query or see it." },
  { q: "Can I try it for free?", a: "Yes, a 14-day free trial gives you a basic dashboard and a limited number of AI chat questions with no card required." },
  { q: "Do you support multiple stores or locations?", a: "Yes, on the Pro plan, including stock-rebalancing suggestions across locations." },
  { q: "What kind of business is this best for?", a: "Retailers and e-commerce sellers with dozens to a few hundred SKUs who want forecasting-grade insight without hiring a data team." },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="max-w-3xl mx-auto px-6 py-20">
      <h2 className="font-display text-2xl font-semibold text-center mb-1">Frequently asked</h2>
      <p className="text-muted text-sm text-center mb-10">Still unsure? Here's the rundown.</p>
      <div className="divide-y divide-line border-t border-b border-line">
        {FAQS.map((f, i) => (
          <div key={f.q}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between py-4 text-left"
            >
              <span className="text-sm font-medium">{f.q}</span>
              <ChevronDown
                size={16}
                className={`text-muted shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`}
              />
            </button>
            {open === i && <p className="text-sm text-muted leading-relaxed pb-4 pr-8">{f.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
