import RiskBadge, { RiskStatus } from "@/components/ui/RiskBadge";

export type ActionItem = {
  id: string;
  productName: string;
  status: RiskStatus;
  detail: string; // e.g. "8 days of stock left · 40 units/week demand"
  metric: string; // e.g. "₹42,000 revenue at risk"
};

export default function ActionCenter({ items }: { items: ActionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-panel border border-line p-8 text-center text-sm text-muted">
        No urgent actions right now — your inventory is in good shape.
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-panel border border-line shadow-card divide-y divide-line">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <RiskBadge status={item.status} />
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{item.productName}</div>
              <div className="text-xs text-muted truncate">{item.detail}</div>
            </div>
          </div>
          <div className="font-mono text-sm text-right shrink-0">{item.metric}</div>
        </div>
      ))}
    </div>
  );
}
