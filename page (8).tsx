import AppShell from "@/components/layout/AppShell";
import SettingsTabs from "@/components/settings/SettingsTabs";
import BillingActions from "@/components/billing/BillingActions";
import ManageBillingButton from "@/components/billing/ManageBillingButton";
import { createServerClient } from "@/lib/supabaseServer";

export default async function BillingPage() {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: org } = await supabase.from("organizations").select("id,name").single();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan,status,stripe_customer_id,current_period_end")
    .eq("org_id", org?.id)
    .maybeSingle();

  return (
    <AppShell orgName={org?.name} plan={(subscription?.plan as any) ?? "trial"}>
      <SettingsTabs />
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold">Settings & billing</h1>
        <p className="text-sm text-muted mt-1">Manage your organization, plan, and payment details.</p>
      </div>

      <div className="rounded-xl bg-panel border border-line p-5 mb-6">
        <h2 className="font-display text-sm font-semibold mb-4">Organization</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-muted mb-1">Store name</div>
            <div>{org?.name ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">Account email</div>
            <div>{user?.email ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">Subscription status</div>
            <div className="capitalize">{subscription?.status ?? "trial"}</div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">Renews</div>
            <div className="font-mono">
              {subscription?.current_period_end
                ? new Date(subscription.current_period_end).toLocaleDateString()
                : "—"}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <ManageBillingButton stripeCustomerId={subscription?.stripe_customer_id ?? null} />
        </div>
      </div>

      <h2 className="font-display text-sm font-semibold mb-3">Plans</h2>
      <BillingActions
        orgId={org?.id ?? ""}
        currentPlan={subscription?.plan ?? "trial"}
        customerEmail={user?.email ?? ""}
        customerName={user?.user_metadata?.full_name}
      />
    </AppShell>
  );
}
