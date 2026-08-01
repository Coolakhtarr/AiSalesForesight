export type RiskStatus = "reorder_now" | "at_risk" | "healthy" | "overstock";

const CONFIG: Record<RiskStatus, { label: string; className: string }> = {
  reorder_now: { label: "Reorder now", className: "bg-signal-coral/10 text-signal-coral border-signal-coral/30" },
  at_risk: { label: "At risk", className: "bg-signal-amber/10 text-signal-amber border-signal-amber/30" },
  healthy: { label: "Healthy", className: "bg-signal-teal/10 text-signal-teal border-signal-teal/30" },
  overstock: { label: "Overstock", className: "bg-signal-violet/10 text-signal-violet border-signal-violet/30" },
};

export default function RiskBadge({ status }: { status: RiskStatus }) {
  const { label, className } = CONFIG[status];
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${className}`}>
      {label}
    </span>
  );
}
