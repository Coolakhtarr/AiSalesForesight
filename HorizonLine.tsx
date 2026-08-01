"use client";

/**
 * Signature visual element: a compact sparkline where historical values are
 * drawn as a solid stroke, and forecasted values continue the same line as
 * a dashed stroke in the same color. Used on KPI cards, product rows, and
 * the main dashboard chart to make "what already happened" vs "what we
 * project" visually literal everywhere it appears.
 */
export default function HorizonLine({
  actual,
  forecast,
  color = "#4FD1C5",
  width = 120,
  height = 32,
}: {
  actual: number[];
  forecast: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const all = [...actual, ...forecast];
  const max = Math.max(...all, 1);
  const min = Math.min(...all, 0);
  const range = max - min || 1;
  const stepX = width / (all.length - 1 || 1);

  const toPoint = (v: number, i: number) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const actualPoints = actual.map((v, i) => toPoint(v, i)).join(" ");
  const forecastPoints = forecast
    .map((v, i) => toPoint(v, i + actual.length - 1)) // connect from last actual point
    .join(" ");
  // prepend the last actual point so the dashed segment visually connects
  const forecastPolyline = actual.length
    ? `${toPoint(actual[actual.length - 1], actual.length - 1)} ${forecastPoints}`
    : forecastPoints;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline points={actualPoints} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <polyline
        points={forecastPolyline}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeDasharray="3 3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
    </svg>
  );
}
