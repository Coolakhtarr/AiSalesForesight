import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0F14",       // app background
        panel: "#121820",     // card background
        panel2: "#171F29",    // slightly raised panel (hover, inputs)
        line: "#212B36",      // hairline borders
        muted: "#8592A3",     // secondary text
        foreground: "#E7ECF2",// primary text
        signal: {
          teal: "#4FD1C5",    // healthy / forecast / positive
          amber: "#F5A623",   // at risk
          coral: "#EF5B5B",   // reorder now / negative
          violet: "#9B8CFF",  // overstock
        },
      },
      fontFamily: {
        display: ["var(--font-inter-tight)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
