"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ElasticityPoint = { productName: string; price: number; quantity: number; elasticity: number };

export default function ElasticityScatter({ points }: { points: ElasticityPoint[] }) {
  if (!points.length) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-muted border border-dashed border-line rounded-lg">
        Not enough price variation yet to estimate sensitivity — this needs products whose
        price has changed at least a few times historically.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ScatterChart margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid stroke="#212B36" strokeDasharray="2 4" />
        <XAxis
          type="number"
          dataKey="price"
          name="Price"
          stroke="#8592A3"
          tick={{ fontSize: 11, fontFamily: "var(--font-plex-mono)" }}
          tickLine={false}
        />
        <YAxis
          type="number"
          dataKey="quantity"
          name="Units sold"
          stroke="#8592A3"
          tick={{ fontSize: 11, fontFamily: "var(--font-plex-mono)" }}
          tickLine={false}
        />
        <ZAxis type="number" range={[60, 60]} />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          contentStyle={{ background: "#171F29", border: "1px solid #212B36", borderRadius: 8, fontSize: 12 }}
          formatter={(value: number, name: string) => [value, name]}
          labelFormatter={() => ""}
        />
        <Scatter data={points} fill="#9B8CFF" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
