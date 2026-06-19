import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { useTransactions, useYearEnd } from "@/lib/taxy-store";
import { computeReport, fmtEUR } from "@/lib/taxy-calc";
import { TrendingUp, TrendingDown, Calculator, Receipt } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { items } = useTransactions();
  const { data: ye } = useYearEnd();
  const { t } = useT();
  const r = useMemo(() => computeReport(items, ye), [items, ye]);

  return (
    <AppShell title={t("auth.brand")} subtitle={t("dash.subtitle")}>
      <div className="space-y-3">
        <SummaryCard
          tone="income"
          label={t("dash.netTurnover")}
          value={r.NET_TURNOVER}
          hint={t("dash.netTurnoverHint")}
          Icon={TrendingUp}
        />
        <SummaryCard
          tone="expense"
          label={t("dash.totalExpenses")}
          value={r.TOTAL_EXPENSES}
          hint={t("dash.totalExpensesHint")}
          Icon={TrendingDown}
        />
        <SummaryCard
          tone="tax"
          label={t("dash.taxableProfit")}
          value={r.TAXABLE_PROFIT}
          hint={t("dash.taxableProfitHint")}
          Icon={Calculator}
        />

        <div className="grid grid-cols-2 gap-3 pt-2">
          <MiniStat label={t("dash.grossProfit")} value={r.GROSS_PROFIT} />
          <MiniStat label={t("dash.netProfit")} value={r.NET_PROFIT} />
          <MiniStat label={t("dash.addbacks")} value={r.ADDBACKS} />
          <MiniStat label={t("dash.capitalAllow")} value={r.CAPITAL_ALLOWANCES} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              {t("dash.recent")}
            </h2>
            <Link to="/" className="text-xs font-medium text-primary">
              {t("dash.viewAll")}
            </Link>
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {t("dash.emptyHint")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {items.slice(0, 5).map((tx) => (
                <li key={tx.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description || tx.category}</p>
                    <p className="text-xs text-muted-foreground">{tx.date} · {tx.category}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{fmtEUR(tx.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground text-center pt-2">
          {t("dash.disclaimer")}
        </p>
      </div>
    </AppShell>
  );
}

function SummaryCard({
  tone, label, value, hint, Icon,
}: {
  tone: "income" | "expense" | "tax";
  label: string;
  value: number;
  hint: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const toneClass = {
    income: "bg-income-soft text-income border-income/20",
    expense: "bg-expense-soft text-expense border-expense/20",
    tax: "bg-tax-soft text-tax border-tax/20",
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</span>
        <Icon className="h-4 w-4 opacity-70" />
      </div>
      <p className="text-2xl font-bold mt-1 tabular-nums">{fmtEUR(value)}</p>
      <p className="text-[11px] mt-1 opacity-70">{hint}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className="text-base font-semibold tabular-nums mt-0.5">{fmtEUR(value)}</p>
    </div>
  );
}
