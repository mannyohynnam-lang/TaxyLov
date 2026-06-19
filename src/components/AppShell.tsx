import { type ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function AppShell({ title, subtitle, action, children }: Props) {
  return (
    <div className="app-shell bg-background">
      <div className="app-shell-frame mx-auto max-w-md">
        <header className="app-shell-header z-40 border-b border-border bg-background/95 backdrop-blur px-4 pb-3 flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            {subtitle ? <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {action}
          </div>
        </header>
        <main className="app-shell-main px-4 pt-4">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
