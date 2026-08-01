"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function NotificationSettingsForm({
  orgId,
  initialWhatsapp,
  initialDigestEmail,
}: {
  orgId: string;
  initialWhatsapp: string | null;
  initialDigestEmail: string | null;
}) {
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp ?? "");
  const [digestEmail, setDigestEmail] = useState(initialDigestEmail ?? "");
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  async function save() {
    await supabase
      .from("organizations")
      .update({ owner_whatsapp_number: whatsapp || null, digest_email: digestEmail || null })
      .eq("id", orgId);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-xl bg-panel border border-line p-5 space-y-4">
      <div>
        <label className="text-xs text-muted block mb-1.5">WhatsApp number for reorder alerts</label>
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="+91XXXXXXXXXX"
          className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 ring-signal-teal"
        />
        <p className="text-xs text-signal-amber mt-1.5">
          Costs money per message via Meta/Twilio — not part of the free tier. Leave blank to use email
          alerts only, at no extra cost.
        </p>
      </div>
      <div>
        <label className="text-xs text-muted block mb-1.5">Email for weekly digest</label>
        <input
          type="email"
          value={digestEmail}
          onChange={(e) => setDigestEmail(e.target.value)}
          placeholder="owner@yourstore.com"
          className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 ring-signal-teal"
        />
      </div>
      <button
        onClick={save}
        className="text-sm bg-signal-teal text-ink px-4 py-2 rounded-lg font-medium hover:opacity-90 transition"
      >
        {saved ? "Saved ✓" : "Save"}
      </button>
    </div>
  );
}
