export default function PlanCard({
  name,
  price,
  features,
  current,
  onSelect,
}: {
  name: string;
  price: string;
  features: string[];
  current: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`rounded-xl border p-5 flex flex-col ${
        current ? "border-signal-teal bg-signal-teal/5" : "border-line bg-panel"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display text-sm font-semibold">{name}</h3>
        {current && (
          <span className="text-[10px] uppercase tracking-wide font-mono text-signal-teal border border-signal-teal/30 rounded-full px-2 py-0.5">
            Current
          </span>
        )}
      </div>
      <div className="font-mono text-xl mb-4">{price}</div>
      <ul className="space-y-2 mb-5 flex-1">
        {features.map((f) => (
          <li key={f} className="text-xs text-muted flex gap-2">
            <span className="text-signal-teal">·</span>
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={onSelect}
        disabled={current}
        className={`w-full py-2 rounded-lg text-sm font-medium transition ${
          current
            ? "bg-panel2 text-muted cursor-default"
            : "bg-signal-teal text-ink hover:opacity-90"
        }`}
      >
        {current ? "Active plan" : "Switch to this plan"}
      </button>
    </div>
  );
}
