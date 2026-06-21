import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useTransactions } from "@/lib/taxy-store";
import { CATEGORIES, CATEGORY_GROUP, CATEGORY_SCOPE, INCOME_CODES, categoriesFor } from "@/lib/taxy-types";
import type { CategoryCode, TxPeriod, Transaction } from "@/lib/taxy-types";
import { fmtEUR } from "@/lib/taxy-calc";
import { suggestCategory } from "@/lib/ai-category.functions";
import { toast } from "sonner";
import { Plus, Search, Trash2, X, Pencil, Sparkles, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { categoryLabel } from "@/lib/category-labels-uk";
import { CapacitorHttp } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

const _API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
const SUGGEST_CATEGORY_ENDPOINT = `${_API_BASE}/api/public/suggest-category`;

function isNativeOrigin(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.origin.startsWith("capacitor:");
}

type SuggestPayload = {
  description: string;
  period: TxPeriod;
  categories: Array<{ code: string; label: string; scope?: "daily" | "yearly" | "both" }>;
};

async function suggestCategoryFromNative(payload: SuggestPayload): Promise<{ code: string }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("You must be signed in.");

  // Use CapacitorHttp instead of fetch. WKWebView enforces strict CORS on the
  // capacitor:// origin — even responses with Access-Control-Allow-Origin: *
  // can be blocked. CapacitorHttp routes the request through the native iOS
  // HTTP layer, bypassing WKWebView CORS entirely and eliminating "load failed".
  const response = await CapacitorHttp.post({
    url: SUGGEST_CATEGORY_ENDPOINT,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: payload,
  });

  const json = response.data as { code?: string; error?: string };
  if (response.status < 200 || response.status >= 300) {
    throw new Error(json?.error || `AI request failed: ${response.status}`);
  }
  if (!json?.code) throw new Error("AI did not return a category.");
  return { code: json.code };
}

export const Route = createFileRoute("/_authenticated/")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const { items, add, update, remove } = useTransactions();
  const { t: tr } = useT();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [tab, setTab] = useState<TxPeriod>("daily");

  const tabItems = useMemo(
    () => items.filter((t) => (t.period ?? "daily") === tab),
    [items, tab],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const source = needle ? items : tabItems;
    if (!needle) return source;
    return source.filter(
      (t) =>
        t.description.toLowerCase().includes(needle) ||
        t.category.toLowerCase().includes(needle) ||
        t.date.includes(needle),
    );
  }, [items, tabItems, q]);

  const dailyCount = items.filter((t) => (t.period ?? "daily") === "daily").length;
  const yearlyCount = items.filter((t) => t.period === "yearly").length;

  return (
    <AppShell
      title={tr("tx.title")}
      subtitle={tr("tx.subtitle", { n: items.length })}
      action={
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-primary text-primary-foreground p-2.5 shadow-sm active:scale-95 transition"
          aria-label={tr("tx.add")}
        >
          <Plus className="h-4 w-4" />
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-1 p-1 mb-3 bg-muted rounded-xl">
        {(["daily", "yearly"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setTab(p)}
            className={`py-2 rounded-lg text-sm font-semibold capitalize transition ${
              tab === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {p === "daily" ? tr("tx.daily") : tr("tx.yearly")}{" "}
            <span className="ml-1 text-xs font-normal opacity-70">
              ({p === "daily" ? dailyCount : yearlyCount})
            </span>
          </button>
        ))}
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tr("tx.search")}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {items.length === 0 ? tr("tx.empty") : tr("tx.noMatches")}
          </p>
          {items.length === 0 && (
            <button
              onClick={() => setOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
            >
              <Plus className="h-4 w-4" /> {tr("tx.addFirst")}
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((t) => {
            const isIncome = INCOME_CODES.includes(t.category);
            const tone = isIncome ? "text-income" : CATEGORY_GROUP[t.category] === "ADJUSTMENT" ? "text-tax" : "text-expense";
            return (
              <li
                key={t.id}
                className="rounded-xl border border-border bg-card p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{t.description || "—"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {t.category}
                    </span>
                    <span className="text-xs text-muted-foreground">{t.date}</span>
                    {t.period === "yearly" && (
                      <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-tax/10 text-tax">
                        {tr("tx.yearly")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-semibold tabular-nums ${tone}`}>
                    {isIncome ? "+" : "−"}{fmtEUR(t.amount)}
                  </span>
                  <button
                    onClick={() => setEditing(t)}
                    className="p-1.5 text-muted-foreground hover:text-foreground transition"
                    aria-label={tr("tx.edit")}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(t.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition"
                    aria-label={tr("tx.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {open && <AddSheet defaultPeriod={tab} onClose={() => setOpen(false)} onSave={(t) => add(t)} />}
      {editing && (
        <AddSheet
          defaultPeriod={editing.period ?? "daily"}
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(t) => update(editing.id, t)}
        />
      )}
    </AppShell>
  );
}

function AddSheet({
  onClose,
  onSave,
  defaultPeriod,
  initial,
}: {
  onClose: () => void;
  onSave: (t: { date: string; description: string; category: CategoryCode; amount: number; period: TxPeriod }) => void;
  defaultPeriod: TxPeriod;
  initial?: Transaction;
}) {
  const { t: tr, lang } = useT();
  const [period, setPeriod] = useState<TxPeriod>(initial?.period ?? defaultPeriod);
  const available = useMemo(() => categoriesFor(period), [period]);
  const groups = useMemo(
    () => Array.from(new Set(available.map((c) => c.group))) as Array<"INCOME" | "PURCHASES" | "OVERHEADS" | "ADJUSTMENT">,
    [available],
  );
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<CategoryCode>(initial?.category ?? available[0]?.code ?? "CASH");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [aiBusy, setAiBusy] = useState(false);
  const [nativeApp, setNativeApp] = useState(false);
  // pendingCategory holds a code that should be applied after the period's
  // <select> options have re-rendered. iOS's native UIPickerView crashes
  // ("variant selector cell index number could not be found") when both the
  // option list and the selected value change in the same render cycle.
  // Splitting it into two cycles (period first, then category via useEffect)
  // fixes the picker crash and ensures the category is always valid.
  const [pendingCategory, setPendingCategory] = useState<{ code: CategoryCode; switched: boolean } | null>(null);
  const askAi = useServerFn(suggestCategory);

  useEffect(() => {
    setNativeApp(isNativeOrigin());
  }, []);

  // Apply the AI-suggested category only after the period state (and therefore
  // the <select> options) has committed to the DOM.
  useEffect(() => {
    if (!pendingCategory) return;
    setCategory(pendingCategory.code);
    toast.success(
      pendingCategory.switched
        ? tr("tx.suggestedSwitched", {
            code: pendingCategory.code,
            period: period === "daily" ? tr("tx.daily") : tr("tx.yearly"),
          })
        : tr("tx.suggested", { code: pendingCategory.code }),
    );
    setPendingCategory(null);
  }, [period, pendingCategory]);

  const switchPeriod = (p: TxPeriod) => {
    setPeriod(p);
    const next = categoriesFor(p)[0]?.code;
    if (next) setCategory(next);
  };

  const handleSuggest = async () => {
    if (!description.trim()) {
      toast.error(tr("tx.addDescFirst"));
      return;
    }
    setAiBusy(true);
    try {
      const payload = {
        description: description.trim(),
        period,
        categories: CATEGORIES.map((c) => ({
          code: c.code,
          label: c.label,
          scope: c.scope,
        })),
      };
      const useNativeEndpoint = nativeApp || isNativeOrigin();
      const res = useNativeEndpoint ? await suggestCategoryFromNative(payload) : await askAi({ data: payload });
      const code = res.code as CategoryCode;
      const scope = CATEGORY_SCOPE[code];
      if (!scope) {
        toast.error(tr("tx.aiUnknown"));
        return;
      }
      const targetPeriod: TxPeriod = scope === "both" ? period : (scope as TxPeriod);
      const switched = targetPeriod !== period;
      if (switched) {
        // Change the period first so the <select> re-renders its options,
        // then apply the category in a separate render via useEffect.
        setPeriod(targetPeriod);
        setPendingCategory({ code, switched: true });
      } else {
        // Same period — no picker race, safe to set category immediately.
        setCategory(code);
        toast.success(tr("tx.suggested", { code }));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tr("tx.aiFailed"));
    } finally {
      setAiBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) return;
    onSave({ date, description: description.trim(), category, amount: num, period });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md bg-card rounded-t-3xl p-5 pb-28 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{initial ? tr("tx.editTitle") : tr("tx.newTitle")}</h2>
          <button type="button" onClick={onClose} className="p-1.5 text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <Field label={tr("tx.period")}>
          <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg">
            {(["daily", "yearly"] as const).map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => switchPeriod(p)}
                className={`py-1.5 rounded-md text-sm font-medium capitalize transition ${
                  period === p ? "bg-card shadow-sm" : "text-muted-foreground"
                }`}
              >
                {p === "daily" ? tr("tx.daily") : tr("tx.yearly")}
              </button>
            ))}
          </div>
        </Field>

        <Field label={tr("tx.date")}>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </Field>

        <Field label={tr("tx.description")}>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={tr("tx.descPlaceholder")}
            maxLength={120}
            className="input"
          />
        </Field>

        <Field label={tr("tx.aiAssistant")}>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {tr("tx.aiHint")}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSuggest}
                disabled={aiBusy || !description.trim()}
                className="flex-1 rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[.98] transition"
              >
                {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {tr("tx.suggest")}
              </button>
            </div>
          </div>
        </Field>

        <Field label={tr("tx.category")}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryCode)}
            className="input"
          >
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {available.filter((c) => c.group === g).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {categoryLabel(c.code, c.label, lang)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>

        <Field label={tr("tx.amount")}>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="input text-lg font-semibold"
          />
        </Field>

        <button
          type="submit"
          className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 active:scale-[.98] transition"
        >
          {initial ? tr("tx.saveChanges") : tr("tx.saveTransaction")}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
