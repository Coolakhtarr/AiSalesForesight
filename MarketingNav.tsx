import Link from "next/link";

export default function MarketingNav() {
  return (
    <header className="max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
      <div className="flex items-baseline gap-1.5">
        <span className="font-display font-semibold text-base tracking-tight">AiSales</span>
        <span className="font-display font-semibold text-base tracking-tight text-signal-teal">Foresight</span>
      </div>
      <nav className="hidden sm:flex items-center gap-8 text-sm text-muted">
        <a href="#how-it-works" className="hover:text-foreground transition">How it works</a>
        <a href="#features" className="hover:text-foreground transition">Features</a>
        <a href="#industries" className="hover:text-foreground transition">Industries</a>
        <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
        <a href="#faq" className="hover:text-foreground transition">FAQ</a>
      </nav>
      <div className="flex items-center gap-3">
        <Link href="/login" className="text-sm text-muted hover:text-foreground transition">Log in</Link>
        <Link
          href="/signup"
          className="text-sm bg-signal-teal text-ink px-4 py-2 rounded-lg font-medium hover:opacity-90 transition"
        >
          Start free trial
        </Link>
      </div>
    </header>
  );
}
