export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between text-xs text-muted">
        <div>© {new Date().getFullYear()} AiSalesForesight</div>
        <div className="flex gap-6">
          <a href="/privacy" className="hover:text-foreground transition">Privacy</a>
          <a href="/terms" className="hover:text-foreground transition">Terms</a>
          <a href="mailto:hello@aisalesforesight.com" className="hover:text-foreground transition">Contact</a>
        </div>
      </div>
    </footer>
  );
}
