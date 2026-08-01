export default function Topbar({
  orgName,
  plan,
}: {
  orgName: string;
  plan: "trial" | "basic" | "pro" | "enterprise";
}) {
  const planColor: Record<string, string> = {
    trial: "text-muted border-line",
    basic: "text-signal-teal border-signal-teal/30",
    pro: "text-signal-violet border-signal-violet/30",
    enterprise: "text-signal-amber border-signal-amber/30",
  };

  return (
    <header className="h-14 border-b border-line flex items-center justify-between px-6 shrink-0">
      <div className="text-sm text-muted">{orgName}</div>
      <span
        className={`text-xs font-mono uppercase tracking-wide px-2.5 py-1 rounded-full border ${planColor[plan]}`}
      >
        {plan}
      </span>
    </header>
  );
}
