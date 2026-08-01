"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ForecastRow = { date: string; predicted_qty: number };

export default function ForecastChart({ data }: { data: ForecastRow[] }) {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-muted border border-dashed border-line rounded-lg">
        No forecast yet — run a forecast job to see projected demand here.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="#212B36" strokeDasharray="2 4" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="#8592A3"
          tick={{ fontSize: 11, fontFamily: "var(--font-plex-mono)" }}
          tickLine={false}
          axisLine={{ stroke: "#212B36" }}
        />
        <YAxis
          stroke="#8592A3"
          tick={{ fontSize: 11, fontFamily: "var(--font-plex-mono)" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "#171F29",
            border: "1px solid #212B36",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="predicted_qty"
          name="Forecasted units"
          stroke="#4FD1C5"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
