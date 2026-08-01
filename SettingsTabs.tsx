"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/settings/billing", label: "Billing" },
  { href: "/settings/notifications", label: "Notifications" },
  { href: "/settings/suppliers", label: "Suppliers" },
];

export default function SettingsTabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 mb-6 border-b border-line">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`text-sm px-3 py-2 border-b-2 transition ${
              active ? "border-signal-teal text-foreground" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
