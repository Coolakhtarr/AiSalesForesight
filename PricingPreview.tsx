"use client";

import { useState } from "react";
import Link from "next/link";
import CurrencySelector from "@/components/billing/CurrencySelector";
import { CurrencyCode, CURRENCY_META, PLAN_PRICING } from "@/lib/pricing";

export default function PricingPreview() {
  const [currency, setCurrency] = useState<CurrencyCode>("usd");
  const symbol = CURRENCY_META[currency].symbol;

  const plans = [
    { key: "trial" as const, name: "Free trial", price: `${symbol}0`, note: "14 days", features: ["Manual upload", "Basic summary dashboard", "10 AI chat questions"] },
    { key: "basic" as const, name: "Basic", price: `${symbol}${PLAN_PRICING.basic[currency].toLocaleString()}`, note: "/mo", features: ["Full forecasts & risk tags", "Up to 100 products", "Unlimited AI chat", "Weekly refresh"], highlight: true },
    { key: "pro" as const, name: "Pro", price: `${symbol}${PLAN_PRICING.pro[currency].toLocaleString()}`, note: "/mo", features: ["Everything in Basic", "Multi-location rebalancing", "Promotion & pricing analytics", "Daily refresh"] },
  ];

  return (
    <section id="pricing" className="max-w-5xl mx-auto px-6 py-20 border-b border-line">
      <h2 className="font-display text-2xl font-semibold text-center mb-1">Simple, usage-matched pricing</h2>
      <p className="text-muted text-sm text-center mb-6">
        Start free. Upgrade when the forecasts start paying for themselves.
      </p>
      <div className="flex justify-center mb-10">
        <CurrencySelector value={currency} onChange={setCurrency} />
      </div>
      {currency === "inr" && (
        <p className="text-center text-xs text-signal-teal mb-8 font-mono">
          Pay by UPI, card, or netbanking — settled instantly via Razorpay
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`rounded-xl border p-6 flex flex-col ${
              p.highlight ? "border-signal-teal bg-signal-teal/5" : "border-line bg-panel"
            }`}
          >
            <h3 className="font-display font-semibold text-sm mb-1">{p.name}</h3>
            <div className="font-mono text-2xl mb-1">
              {p.price}
              <span className="text-sm text-muted">{p.note}</span>
            </div>
            <ul className="space-y-2 my-5 flex-1">
              {p.features.map((f) => (
                <li key={f} className="text-xs text-muted flex gap-2">
                  <span className="text-signal-teal">·</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className={`text-center py-2 rounded-lg text-sm font-medium transition ${
                p.highlight ? "bg-signal-teal text-ink hover:opacity-90" : "border border-line text-muted hover:text-foreground"
              }`}
            >
              Get started
            </Link>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-muted mt-6">
        Also available in AED and SAR for UAE and Saudi Arabia — select above.
      </p>
    </section>
  );
}
