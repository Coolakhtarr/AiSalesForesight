import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Web Crypto (available natively in edge runtimes) instead of Node's
// `crypto` module — avoids depending on Cloudflare's nodejs_compat layer
// for something this simple, so it works the same on Vercel edge,
// Cloudflare Pages, or any other edge runtime without extra config.
async function verifyRazorpaySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expected === signature;
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature")!;

  const isValid = await verifyRazorpaySignature(body, signature, process.env.RAZORPAY_WEBHOOK_SECRET!);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  switch (event.event) {
    case "subscription.activated": {
      const sub = event.payload.subscription.entity;
      const orgId = sub.notes?.org_id;
      if (orgId) {
        await supabaseAdmin.from("subscriptions").upsert({
          org_id: orgId,
          razorpay_subscription_id: sub.id,
          plan: "basic", // TODO: map from plan_id -> plan name
          status: "active",
          currency: "inr",
          payment_provider: "razorpay",
        });
      }
      break;
    }
    case "subscription.cancelled":
    case "subscription.completed": {
      const sub = event.payload.subscription.entity;
      await supabaseAdmin
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("razorpay_subscription_id", sub.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
