import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Calls Razorpay's REST API directly via fetch rather than the `razorpay`
// npm package, which depends on axios/Node internals that aren't reliable
// on edge runtimes (Cloudflare Pages, Vercel Edge). Basic auth uses
// key_id:key_secret, base64-encoded — exactly what the SDK does under the
// hood, just without the Node-specific dependency chain.
const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

// One Razorpay Plan ID per subscription tier, created once in the Razorpay
// dashboard (Products -> Plans) in INR. UPI AutoPay is offered automatically
// by Razorpay's checkout alongside cards/netbanking — no separate UPI
// integration is needed, it's a payment method within the same checkout.
const RAZORPAY_PLAN_IDS: Record<string, string> = {
  basic: process.env.RAZORPAY_PLAN_BASIC!,
  pro: process.env.RAZORPAY_PLAN_PRO!,
};

function razorpayAuthHeader(): string {
  const credentials = `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`;
  return `Basic ${btoa(credentials)}`; // btoa is available natively on edge runtimes
}

export async function POST(req: NextRequest) {
  const { plan, orgId, customerEmail, customerName } = await req.json();
  const planId = RAZORPAY_PLAN_IDS[plan];
  if (!planId) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }

  // Razorpay subscriptions are created server-side, then the returned
  // subscription id is handed to Razorpay Checkout (client-side widget)
  // which renders UPI, cards, netbanking, and wallets as options.
  const res = await fetch(`${RAZORPAY_API_BASE}/subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: razorpayAuthHeader(),
    },
    body: JSON.stringify({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12, // 12 monthly cycles; Razorpay auto-renews the mandate
      notes: { org_id: orgId },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    return NextResponse.json({ error: `Razorpay error: ${errorBody}` }, { status: 502 });
  }

  const subscription = await res.json();

  return NextResponse.json({
    subscriptionId: subscription.id,
    keyId: process.env.RAZORPAY_KEY_ID,
    prefill: { email: customerEmail, name: customerName },
  });
}
