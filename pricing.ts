export type CurrencyCode = "inr" | "usd" | "aed" | "sar";

export const CURRENCY_META: Record<CurrencyCode, { symbol: string; label: string; provider: "razorpay" | "stripe" }> = {
  inr: { symbol: "₹", label: "India (UPI, cards, netbanking)", provider: "razorpay" },
  usd: { symbol: "$", label: "USA, and everywhere else", provider: "stripe" },
  aed: { symbol: "AED", label: "UAE / Dubai", provider: "stripe" },
  sar: { symbol: "SAR", label: "Saudi Arabia", provider: "stripe" },
};

// Prices are set independently per currency (not a raw FX conversion) —
// standard SaaS practice, since a straight conversion often reads as
// oddly-priced (e.g. $17.99) and ignores local willingness-to-pay.
export const PLAN_PRICING: Record<"basic" | "pro", Record<CurrencyCode, number>> = {
  basic: { inr: 1499, usd: 29, aed: 109, sar: 109 },
  pro: { inr: 3999, usd: 79, aed: 289, sar: 289 },
};

export function detectDefaultCurrency(countryCode?: string | null): CurrencyCode {
  switch (countryCode) {
    case "IN":
      return "inr";
    case "AE":
      return "aed";
    case "SA":
      return "sar";
    default:
      return "usd";
  }
}
