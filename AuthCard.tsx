export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-baseline gap-1.5 justify-center mb-8">
          <span className="font-display font-semibold text-lg tracking-tight">AiSales</span>
          <span className="font-display font-semibold text-lg tracking-tight text-signal-teal">Foresight</span>
        </div>

        <div className="rounded-2xl bg-panel border border-line shadow-card p-7">
          <h1 className="font-display text-lg font-semibold mb-1">{title}</h1>
          <p className="text-sm text-muted mb-6">{subtitle}</p>
          {children}
        </div>

        <div className="text-center text-sm text-muted mt-5">{footer}</div>
      </div>
    </div>
  );
}
