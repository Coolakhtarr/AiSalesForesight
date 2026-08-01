import AppShell from "@/components/layout/AppShell";
import SettingsTabs from "@/components/settings/SettingsTabs";
import SuppliersManager from "@/components/settings/SuppliersManager";
import { createServerClient } from "@/lib/supabaseServer";

export default async function SuppliersPage() {
  const supabase = createServerClient();
  const { data: org } = await supabase.from("organizations").select("id").single();
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id,name,email,whatsapp_number,default_lead_time_days")
    .order("name");

  return (
    <AppShell>
      <SettingsTabs />
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold">Suppliers</h1>
        <p className="text-sm text-muted mt-1">
          Purchase orders are grouped by supplier — add yours here, then assign each product to one.
        </p>
      </div>
      <SuppliersManager orgId={org?.id ?? ""} suppliers={suppliers || []} />
    </AppShell>
  );
}
