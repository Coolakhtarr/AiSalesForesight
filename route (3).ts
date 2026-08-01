import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge"; // required for Cloudflare Pages via @cloudflare/next-on-pages

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  httpClient: Stripe.createFetchHttpClient(), // required for edge runtimes
});

// One Stripe Price ID per plan per non-INR currency. INR is handled by
// Razorpay instead (see /api/razorpay/checkout) since Stripe doesn't
// support UPI or domestic INR settlement for most merchants as of 2026 —
// Razorpay is the standard choice for Indian customers, Stripe for
// everywhere else.
const PRICE_IDS: Record<string, Record<string, string>> = {
  basic: {
    usd: process.env.STRIPE_PRICE_BASIC_USD!,
    aed: process.env.STRIPE_PRICE_BASIC_AED!,
    sar: process.env.STRIPE_PRICE_BASIC_SAR!,
  },
  pro: {
    usd: process.env.STRIPE_PRICE_PRO_USD!,
    aed: process.env.STRIPE_PRICE_PRO_AED!,
    sar: process.env.STRIPE_PRICE_PRO_SAR!,
  },
};

export async function POST(req: NextRequest) {
  const { plan, orgId, customerEmail, currency = "usd" } = await req.json();
  const priceId = PRICE_IDS[plan]?.[currency];
  if (!priceId) {
    return NextResponse.json({ error: "Unknown plan/currency combination" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: customerEmail,
    client_reference_id: orgId, // used by the webhook to link back to the org
    metadata: { plan, currency },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?canceled=true`,
  });

  return NextResponse.json({ url: session.url });
}
