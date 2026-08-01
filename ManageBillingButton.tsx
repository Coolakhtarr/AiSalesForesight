"use client";

export default function ManageBillingButton({ stripeCustomerId }: { stripeCustomerId: string | null }) {
  if (!stripeCustomerId) return null;

  async function openPortal() {
    const res = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stripeCustomerId }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <button
      onClick={openPortal}
      className="text-sm text-muted hover:text-foreground border border-line rounded-lg px-3 py-2 transition"
    >
      Manage billing & invoices
    </button>
  );
}
