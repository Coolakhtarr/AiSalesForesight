"use client";

// Ambient background: a field of horizon-lines (solid actual -> dashed forecast)
// drifting slowly, echoing the product's core visual signature at scale.
// Respects prefers-reduced-motion via the animation-duration override in globals.css.
export default function HeroBackground() {
  const lines = Array.from({ length: 7 }, (_, i) => i);
  const colors = ["#4FD1C5", "#9B8CFF", "#F5A623"];

  return (
    <svg
      viewBox="0 0 1200 500"
      className="absolute inset-0 w-full h-full opacity-[0.35]"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {lines.map((i) => {
        const y = 60 + i * 60;
        const color = colors[i % colors.length];
        const wobble = 20 + (i % 3) * 10;
        const solidPath = `M -50 ${y} Q 150 ${y - wobble} 350 ${y} T 750 ${y}`;
        const dashedPath = `M 750 ${y} Q 950 ${y - wobble} 1150 ${y} T 1350 ${y}`;
        return (
          <g key={i} style={{ animation: `drift ${18 + i * 2}s ease-in-out infinite`, animationDelay: `${i * 0.6}s` }}>
            <path d={solidPath} stroke={color} strokeWidth="1.5" fill="none" opacity={0.5} />
            <path d={dashedPath} stroke={color} strokeWidth="1.5" strokeDasharray="4 5" fill="none" opacity={0.35} />
          </g>
        );
      })}
      <style>{`
        @keyframes drift {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(10px); }
        }
      `}</style>
    </svg>
  );
}
