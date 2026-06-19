import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Mail, Trash2, AlertTriangle, Loader2, Languages, CreditCard, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { t, lang, setLang } = useT();
  const [email, setEmail] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", uid)
        .maybeSingle();
      setSubscriptionStatus(profile?.status ?? "not_paid");
    });
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  };

  const deleteAll = async () => {
    setBusy(true);
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (uid) {
      await supabase.from("transactions").delete().eq("user_id", uid);
      await supabase.from("year_end_inputs").delete().eq("user_id", uid);
      // Wipe local cached copies too
      ["taxy.transactions.v1", "taxy.yearend.v1"].forEach((k) => localStorage.removeItem(k));
      window.dispatchEvent(new CustomEvent("taxy-storage", { detail: { key: "all" } }));
    }
    setBusy(false);
    setConfirmDelete(false);
  };

  return (
    <AppShell title={t("set.title")} subtitle={t("set.subtitle")}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">{t("set.signedInAs")}</h2>
          </div>
          <p className="text-sm text-foreground break-all">{email || "—"}</p>
        </div>

        <button
          type="button"
          onClick={() => { navigate({ to: "/paywall", search: { change: "1" } }); }}
          className="w-full rounded-2xl border border-border bg-card p-4 flex items-center justify-between active:scale-[.99] transition"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-foreground" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">{t("set.subscription")}</p>
              <p className="text-xs text-muted-foreground">{t("set.subscriptionHint")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {subscriptionStatus === "annual_paid"
                ? t("set.subscriptionYearly")
                : subscriptionStatus === "monthly_paid"
                ? t("set.subscriptionMonthly")
                : t("set.subscriptionNone")}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </button>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <div>
              <h2 className="font-semibold text-sm">{t("set.language")}</h2>
              <p className="text-xs text-muted-foreground">{t("set.languageHint")}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg">
            {(["en", "uk"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`py-2 rounded-md text-sm font-semibold transition ${
                  lang === l ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                {l === "en" ? "English" : "Українська"}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={signOut}
          className="w-full rounded-2xl border border-border bg-card p-4 flex items-center justify-between active:scale-[.99] transition"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
              <LogOut className="h-4 w-4 text-foreground" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">{t("set.signOut")}</p>
              <p className="text-xs text-muted-foreground">{t("set.signOutHint")}</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="w-full rounded-2xl border border-expense/30 bg-expense-soft p-4 flex items-center justify-between active:scale-[.99] transition"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-expense/10 flex items-center justify-center">
              <Trash2 className="h-4 w-4 text-expense" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm text-expense">{t("set.deleteAll")}</p>
              <p className="text-xs text-expense/80">{t("set.deleteAllHint")}</p>
            </div>
          </div>
        </button>

        <p className="text-[11px] text-muted-foreground text-center pt-2">
          {t("set.dataNote")}
        </p>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 p-4" onClick={() => setConfirmDelete(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-card rounded-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-expense/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-expense" />
              </div>
              <div>
                <h3 className="font-semibold">{t("set.deleteConfirmTitle")}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("set.deleteConfirmBody")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmDelete(false)} className="flex-1 rounded-xl border border-border bg-card font-medium py-2.5">
                {t("set.cancel")}
              </button>
              <button type="button" onClick={deleteAll} disabled={busy} className="flex-1 rounded-xl bg-expense text-white font-semibold py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t("set.deleteAll")}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
