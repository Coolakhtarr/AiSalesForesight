"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";

type Item = { id: string; quantity: number; estimated_unit_cost: number; reason: string; products: { name: string } };

export default function PurchaseOrderCard({
  id,
  supplierName,
  status,
  totalCost,
  items,
}: {
  id: string;
  supplierName: string;
  status: string;
  totalCost: number;
  items: Item[];
}) {
  const [sending, setSending] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  const supabase = createClient();

  async function exportPdf() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const res = await fetch(`${process.env.NEXT_PUBLIC_ML_SERVICE_URL}/purchase-orders/${id}/pdf`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `purchase_order_${id.slice(0, 8)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function emailToSupplier() {
    setSending(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const res = await fetch(`${process.env.NEXT_PUBLIC_ML_SERVICE_URL}/purchase-orders/${id}/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await res.json();
    if (data.sent) setCurrentStatus("sent");
    setSending(false);
  }

  return (
    <div className="rounded-xl bg-panel border border-line overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-line">
        <div>
          <div className="font-medium text-sm">{supplierName}</div>
          <div className="text-xs text-muted capitalize">{currentStatus}</div>
        </div>
        <div className="font-mono text-sm">₹{Math.round(totalCost).toLocaleString("en-IN")}</div>
      </div>
      <div className="divide-y divide-line">
        {items.map((item) => (
          <div key={item.id} className="px-5 py-3 flex items-center justify-between text-sm">
            <div>
              <div>{item.products?.name}</div>
              <div className="text-xs text-muted">{item.reason}</div>
            </div>
            <div className="font-mono text-right shrink-0 ml-4">
              {item.quantity} × ₹{item.estimated_unit_cost}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 px-5 py-3 border-t border-line">
        <button
          onClick={exportPdf}
          className="text-xs px-3 py-1.5 rounded-lg border border-line text-muted hover:text-foreground transition"
        >
          Export PDF
        </button>
        <button
          onClick={emailToSupplier}
          disabled={sending || currentStatus === "sent"}
          className="text-xs px-3 py-1.5 rounded-lg border border-line text-muted hover:text-foreground transition disabled:opacity-50"
        >
          {currentStatus === "sent" ? "Sent ✓" : sending ? "Sending…" : "Email to supplier"}
        </button>
      </div>
    </div>
  );
}
