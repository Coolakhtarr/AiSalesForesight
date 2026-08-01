"use client";

import { useState } from "react";
import Script from "next/script";
import PlanCard from "@/components/billing/PlanCard";
import CurrencySelector from "@/components/billing/CurrencySelector";
import { CurrencyCode, CURRENCY_META, PLAN_PRICING, detectDefaultCurrency } from "@/lib/pricing";
import { track } from "@/lib/posthog";

export default function BillingActions({
  orgId,
  currentPlan,
  customerEmail,
  customerName,
  detectedCountry,
}: {
  orgId: string;
  currentPlan: string;
  customerEmail: string;
  customerName?: string;
  detectedCountry?: string | null;
}) {
  const [currency, setCurrency] = useState<CurrencyCode>(detectDefaultCurrency(detectedCountry));
  const [loading, setLoading] = useState<string | null>(null);

  async function startCheckout(plan: "basic" | "pro") {
    setLoading(plan);
    track("checkout_started", { plan, currency, provider: CURRENCY_META[currency].provider });

    if (CURRENCY_META[currency].provider === "razorpay") {
      const res = await fetch("/api/razorpay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, orgId, customerEmail, customerName }),
      });
      const data = await res.json();
      openRazorpayCheckout(data);
    } else {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, orgId, customerEmail, currency }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    }
    setLoading(null);
  }

  function openRazorpayCheckout(data: { subscriptionId: string; keyId: string; prefill: any }) {
    // @ts-ignore — Razorpay is loaded via the <Script> tag below
    const rzp = new window.Razorpay({
      key: data.keyId,
      subscription_id: data.subscriptionId,
      name: "AiSalesForesight",
      description: "Subscription — pay via UPI, card, or netbanking",
      prefill: data.prefill,
      theme: { color: "#4FD1C5" },
      handler: function () {
        window.location.href = "/settings/billing?success=true";
      },
    });
    rzp.open();
  }

  return (
    <div>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-xs text-muted">
          Billed in {CURRENCY_META[currency].label}
          {CURRENCY_META[currency].provider === "razorpay" && " — pay by UPI, card, or netbanking"}
        </p>
        <CurrencySelector value={currency} onChange={setCurrency} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(["basic", "pro"] as const).map((planKey) => {
          const price = PLAN_PRICING[planKey][currency];
          const symbol = CURRENCY_META[currency].symbol;
          return (
            <PlanCard
              key={planKey}
              name={planKey === "basic" ? "Basic" : "Pro"}
              price={`${symbol}${price.toLocaleString()}/mo`}
              features={
                planKey === "basic"
                  ? ["Full forecasts & risk tags", "Up to 100 products", "Unlimited AI chat", "Weekly data refresh"]
                  : ["Everything in Basic", "Multi-location rebalancing", "Promotion & pricing analytics", "Daily data refresh"]
              }
              current={currentPlan === planKey}
              onSelect={() => startCheckout(planKey)}
            />
          );
        })}
      </div>
    </div>
  );
}
