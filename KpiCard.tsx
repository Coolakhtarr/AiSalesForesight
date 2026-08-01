import HorizonLine from "@/components/charts/HorizonLine";

export default function KpiCard({
  label,
  value,
  delta,
  deltaTone = "neutral",
  sparkline,
  color = "#4FD1C5",
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  sparkline?: { actual: number[]; forecast: number[] };
  color?: string;
}) {
  const toneClass = {
    positive: "text-signal-teal",
    negative: "text-signal-coral",
    neutral: "text-muted",
  }[deltaTone];

  return (
    <div className="rounded-xl bg-panel border border-line shadow-card p-5 flex flex-col gap-3">
      <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
      <div className="flex items-end justify-between">
        <div className="font-mono text-2xl font-medium">{value}</div>
        {sparkline && (
          <HorizonLine actual={sparkline.actual} forecast={sparkline.forecast} color={color} width={90} height={28} />
        )}
      </div>
      {delta && <div className={`text-xs font-mono ${toneClass}`}>{delta}</div>}
    </div>
  );
}
