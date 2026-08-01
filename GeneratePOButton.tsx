"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { track } from "@/lib/posthog";

export default function GeneratePOButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function generate() {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch(`${process.env.NEXT_PUBLIC_ML_SERVICE_URL}/purchase-orders/generate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await res.json();
    track("purchase_orders_generated", { count: data.purchase_orders?.length ?? 0 });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="text-sm bg-signal-teal text-ink px-4 py-2 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
    >
      {loading ? "Generating…" : "Generate draft POs from today's reorder list"}
    </button>
  );
}
