"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadStep from "@/components/onboarding/UploadStep";
import { createClient } from "@/lib/supabaseClient";
import { track } from "@/lib/posthog";

const STEPS = [
  { n: 1, title: "Upload your sales data", desc: "A CSV or Excel export with date, product, quantity, and price." },
  { n: 2, title: "Optionally add inventory", desc: "Current stock levels help us flag reorder and overstock risk." },
  { n: 3, title: "Tell us about your store", desc: "Time zone and typical reorder lead time." },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [leadTime, setLeadTime] = useState(14);
  const router = useRouter();
  const supabase = createClient();

  async function ensureOrg() {
    if (orgId) return orgId;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: existing } = await supabase
      .from("memberships")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (existing) {
      setOrgId(existing.org_id);
      return existing.org_id;
    }
    const { data: org } = await supabase.from("organizations").insert({ name: "My Store" }).select().single();
    await supabase.from("memberships").insert({ user_id: user.id, org_id: org!.id, role: "owner" });
    setOrgId(org!.id);
    return org!.id;
  }

  async function finishSetup() {
    const id = await ensureOrg();
    if (id) {
      await supabase
        .from("organizations")
        .update({ timezone, default_lead_time_days: leadTime })
        .eq("id", id);
    }
    track("onboarding_completed");
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s) => (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono border ${
                  s.n <= step
                    ? "bg-signal-teal text-ink border-signal-teal"
                    : "border-line text-muted"
                }`}
              >
                {s.n}
              </div>
              {s.n < STEPS.length && <div className={`h-px flex-1 ${s.n < step ? "bg-signal-teal" : "bg-line"}`} />}
            </div>
          ))}
        </div>

        <h1 className="font-display text-lg font-semibold mb-1">{STEPS[step - 1].title}</h1>
        <p className="text-sm text-muted mb-6">{STEPS[step - 1].desc}</p>

        {step === 1 && (
          <>
            <PreStepOrgGate onReady={ensureOrg} render={(id) => <UploadStep orgId={id} kind="sales" />} />
            <button onClick={() => setStep(2)} className="mt-6 w-full py-2.5 rounded-lg bg-signal-teal text-ink text-sm font-medium hover:opacity-90 transition">
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <PreStepOrgGate onReady={ensureOrg} render={(id) => <UploadStep orgId={id} kind="inventory" />} />
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-lg border border-line text-sm text-muted hover:text-foreground transition">
                Back
              </button>
              <button onClick={() => setStep(3)} className="flex-1 py-2.5 rounded-lg bg-signal-teal text-ink text-sm font-medium hover:opacity-90 transition">
                Continue
              </button>
            </div>
            <button onClick={() => setStep(3)} className="mt-3 w-full text-xs text-muted hover:text-foreground transition">
              Skip — I'll add inventory later
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1.5">Time zone</label>
                <input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 ring-signal-teal"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1.5">Typical reorder lead time (days)</label>
                <input
                  type="number"
                  value={leadTime}
                  onChange={(e) => setLeadTime(Number(e.target.value))}
                  className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 ring-signal-teal"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-lg border border-line text-sm text-muted hover:text-foreground transition">
                Back
              </button>
              <button onClick={finishSetup} className="flex-1 py-2.5 rounded-lg bg-signal-teal text-ink text-sm font-medium hover:opacity-90 transition">
                Go to dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Small helper so UploadStep always receives a real org_id, creating one on first use.
function PreStepOrgGate({
  onReady,
  render,
}: {
  onReady: () => Promise<string | null>;
  render: (orgId: string) => React.ReactNode;
}) {
  const [id, setId] = useState<string | null>(null);
  if (!id) {
    onReady().then((resolved) => resolved && setId(resolved));
    return <div className="h-32 flex items-center justify-center text-sm text-muted">Setting up your workspace…</div>;
  }
  return <>{render(id)}</>;
}
