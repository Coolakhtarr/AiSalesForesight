"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

type Supplier = { id: string; name: string; email: string | null; whatsapp_number: string | null; default_lead_time_days: number };

export default function SuppliersManager({ orgId, suppliers }: { orgId: string; suppliers: Supplier[] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [leadTime, setLeadTime] = useState(14);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function addSupplier(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("suppliers").insert({
      org_id: orgId,
      name,
      email: email || null,
      whatsapp_number: whatsapp || null,
      default_lead_time_days: leadTime,
    });
    setName("");
    setEmail("");
    setWhatsapp("");
    setLeadTime(14);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <form onSubmit={addSupplier} className="rounded-xl bg-panel border border-line p-5 space-y-4 h-fit">
        <h2 className="font-display text-sm font-semibold">Add a supplier</h2>
        <div>
          <label className="text-xs text-muted block mb-1.5">Supplier name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 ring-signal-teal"
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1.5">Email (for sending POs)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 ring-signal-teal"
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1.5">WhatsApp number (optional)</label>
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+91XXXXXXXXXX"
            className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 ring-signal-teal"
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1.5">Default lead time (days)</label>
          <input
            type="number"
            value={leadTime}
            onChange={(e) => setLeadTime(Number(e.target.value))}
            className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 ring-signal-teal"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-signal-teal text-ink text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add supplier"}
        </button>
      </form>

      <div className="rounded-xl bg-panel border border-line divide-y divide-line">
        {suppliers.length === 0 && (
          <div className="p-6 text-sm text-muted text-center">
            No suppliers yet. Add one, then assign it to products from the Products page.
          </div>
        )}
        {suppliers.map((s) => (
          <div key={s.id} className="px-5 py-4">
            <div className="font-medium text-sm">{s.name}</div>
            <div className="text-xs text-muted mt-1 space-x-3">
              {s.email && <span>{s.email}</span>}
              {s.whatsapp_number && <span>{s.whatsapp_number}</span>}
              <span>{s.default_lead_time_days}-day lead time</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
