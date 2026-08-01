import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  httpClient: Stripe.createFetchHttpClient(), // required for edge runtimes
});

export async function POST(req: NextRequest) {
  const { stripeCustomerId } = await req.json();
  if (!stripeCustomerId) {
    return NextResponse.json({ error: "Missing stripeCustomerId" }, { status: 400 });
  }
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
  });
  return NextResponse.json({ url: session.url });
}
