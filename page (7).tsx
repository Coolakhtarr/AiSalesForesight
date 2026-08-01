import AppShell from "@/components/layout/AppShell";
import SettingsTabs from "@/components/settings/SettingsTabs";
import NotificationSettingsForm from "@/components/settings/NotificationSettingsForm";
import { createServerClient } from "@/lib/supabaseServer";

export default async function NotificationSettingsPage() {
  const supabase = createServerClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("id,owner_whatsapp_number,digest_email")
    .single();

  return (
    <AppShell>
      <SettingsTabs />
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold">Notifications</h1>
        <p className="text-sm text-muted mt-1">Where reorder alerts and the weekly digest get sent.</p>
      </div>
      <NotificationSettingsForm
        orgId={org?.id ?? ""}
        initialWhatsapp={org?.owner_whatsapp_number ?? null}
        initialDigestEmail={org?.digest_email ?? null}
      />
    </AppShell>
  );
}
