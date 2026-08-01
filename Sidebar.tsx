"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Package,
  Sparkles,
  MessageCircle,
  Settings,
  ClipboardList,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/products", label: "Products", icon: Package },
  { href: "/purchase-orders", label: "Purchase Orders", icon: ClipboardList },
  { href: "/insights", label: "Insights", icon: Sparkles },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/settings/billing", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-line bg-panel/60 flex flex-col">
      <div className="px-5 py-5 border-b border-line">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display font-semibold text-[15px] tracking-tight">AiSales</span>
          <span className="font-display font-semibold text-[15px] tracking-tight text-signal-teal">
            Foresight
          </span>
        </div>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-panel2 text-foreground"
                  : "text-muted hover:text-foreground hover:bg-panel2/60"
              }`}
            >
              <Icon size={16} strokeWidth={2} className={active ? "text-signal-teal" : ""} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-line text-xs text-muted">
        Data current as of today · <span className="font-mono">v1</span>
      </div>
    </aside>
  );
}
