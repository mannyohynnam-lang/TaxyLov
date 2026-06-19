import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Receipt, Settings, FileText } from "lucide-react";
import { useT } from "@/lib/i18n";

const items = [
  { to: "/", labelKey: "nav.log", icon: Receipt },
  { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/report", labelKey: "nav.report", icon: FileText },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  const { t } = useT();
  return (
    <nav className="app-bottom-nav z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <ul className="grid grid-cols-4 mx-auto max-w-md">
        {items.map(({ to, labelKey, icon: Icon }) => {
          const active = pathname === to;
          return (
            <li key={to}>
              <Link
                to={to}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "scale-110" : ""} transition-transform`} />
                <span className="font-medium">{t(labelKey as any)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
