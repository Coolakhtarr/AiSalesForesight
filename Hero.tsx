import Link from "next/link";
import HeroBackground from "./HeroBackground";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <HeroBackground />
      <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-signal-teal border border-signal-teal/30 rounded-full px-3 py-1 mb-6">
          Now reading your data, not just your dashboards
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] mb-5">
          Your AI copilot for <br className="hidden sm:block" />
          sales & inventory decisions.
        </h1>
        <p className="text-muted text-base sm:text-lg max-w-xl mx-auto mb-8">
          Upload your past sales data once. Get continuous AI-powered forecasts, product
          insights, and chat-based recommendations to stop stockouts, reduce overstock, and
          grow your sales.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/signup"
            className="bg-signal-teal text-ink px-6 py-3 rounded-lg font-medium text-sm hover:opacity-90 transition"
          >
            Start free trial
          </Link>
          <a
            href="#how-it-works"
            className="border border-line px-6 py-3 rounded-lg font-medium text-sm text-muted hover:text-foreground transition"
          >
            See how it works
          </a>
        </div>
        <p className="text-xs text-muted mt-4 font-mono">No card required · 14-day free trial</p>
      </div>
    </section>
  );
}
