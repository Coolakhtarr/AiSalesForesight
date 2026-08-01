"use client";

import { CurrencyCode, CURRENCY_META } from "@/lib/pricing";

export default function CurrencySelector({
  value,
  onChange,
}: {
  value: CurrencyCode;
  onChange: (c: CurrencyCode) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-panel2 p-1 gap-1">
      {(Object.keys(CURRENCY_META) as CurrencyCode[]).map((code) => (
        <button
          key={code}
          onClick={() => onChange(code)}
          className={`text-xs px-3 py-1.5 rounded-md font-mono uppercase transition ${
            value === code ? "bg-signal-teal text-ink" : "text-muted hover:text-foreground"
          }`}
          title={CURRENCY_META[code].label}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
