import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Check, RotateCcw, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  getOfferings,
  getPlatform,
  hasActiveEntitlement,
  identifyRevenueCatUser,
  purchasePackage,
  restorePurchases,
  type Offering,
} from "@/lib/revenuecat";

type PaywallSearch = {
  change?: string;
};

export const Route = createFileRoute("/paywall")({
  validateSearch: (search: Record<string, unknown>): PaywallSearch => ({
    change: typeof search.change === "string" ? search.change : undefined,
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: PaywallPage,
});

type Plan = "monthly_paid" | "annual_paid";

function PaywallPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { t } = useT();
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [offering, setOffering] = useState<Offering | null>(null);
  const platform = getPlatform();
  const isNative = platform === "ios" || platform === "android";

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("status, business_type, business_area")
        .eq("id", u.user.id)
        .maybeSingle();

      const isChanging = search.change === "1";

      if (data?.status && data.status !== "not_paid" && !isChanging) {
        if (!data.business_type || !data.business_area) {
          navigate({ to: "/onboarding" });
        } else {
          navigate({ to: "/" });
        }
        return;
      }
      setStatus(data?.status ?? "not_paid");

      if (isNative) {
        try {
          await identifyRevenueCatUser(u.user.id);
          // If they already own it (e.g. reinstall), unlock immediately — but only when
          // the user isn't explicitly coming here to change their subscription.
          if (!isChanging && (await hasActiveEntitlement())) {
            await syncEntitlementToProfile(u.user.id, "monthly_paid");
            navigate({ to: "/onboarding" });
            return;
          }
          const offerings = await getOfferings();
          setOffering(offerings);
        } catch (e) {
          console.warn("RevenueCat init failed", e);
        }
      }
    })();
  }, [navigate, isNative, search.change]);

  const syncEntitlementToProfile = async (userId: string, plan: Plan) => {
    await supabase.from("profiles").update({ status: plan }).eq("id", userId);
  };

  const buyNative = async (plan: Plan, label: string) => {
    setBusy(label);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const pkg = plan === "annual_paid" ? offering?.annual?.raw : offering?.monthly?.raw;
      if (!pkg) {
        toast.error("This plan is not available right now.");
        return;
      }
      const ok = await purchasePackage(pkg);
      if (!ok) {
        toast.error("Purchase did not unlock premium.");
        return;
      }
      await syncEntitlementToProfile(u.user.id, plan);
      toast.success(t("paywall.activated", { label }));
      navigate({ to: "/onboarding" });
    } catch (e) {
      const err = e as { userCancelled?: boolean; message?: string };
      if (!err.userCancelled) toast.error(err.message ?? "Purchase failed");
    } finally {
      setBusy(null);
    }
  };

  const activateWeb = async (plan: Plan, label: string) => {
    setBusy(label);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setBusy(null);
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ status: plan })
      .eq("id", u.user.id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("paywall.activated", { label }));
    navigate({ to: "/onboarding" });
  };

  const activate = isNative ? buyNative : activateWeb;

  const handleRestore = async () => {
    setBusy("restore");
    try {
      const { data: u } = await supabase.auth.getUser();
      const ok = await restorePurchases();
      if (ok && u.user) {
        await syncEntitlementToProfile(u.user.id, "monthly_paid");
        toast.success("Purchases restored");
        navigate({ to: "/onboarding" });
      } else {
        toast.info("No previous purchases found");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (!status) return null;

  return (
    <div className="safe-area-page flex items-start justify-center bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">{t("paywall.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("paywall.subtitle")}</p>
        </div>

        <Card className="p-5 space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="font-medium">{t("paywall.monthly")}</div>
              <div className="text-xs text-muted-foreground">{t("paywall.monthlyHint")}</div>
            </div>
            <div className="text-xl font-semibold">{offering?.monthly?.priceString ?? "€3"}<span className="text-xs text-muted-foreground">{offering?.monthly ? "" : t("paywall.perMo")}</span></div>
          </div>
          <Button
            className="w-full"
            disabled={!!busy}
            onClick={() => activate("monthly_paid", t("paywall.monthly"))}
          >
            {busy === t("paywall.monthly") ? t("paywall.activating") : t("paywall.getMonthly")}
          </Button>
        </Card>

        <Card className="p-5 space-y-3 border-primary">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="font-medium flex items-center gap-2">
                {t("paywall.yearly")}
                <span className="text-[10px] uppercase tracking-wider bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                  {t("paywall.bestValue")}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{t("paywall.save17")}</div>
            </div>
            <div className="text-xl font-semibold">{offering?.annual?.priceString ?? "€30"}<span className="text-xs text-muted-foreground">{offering?.annual ? "" : t("paywall.perYr")}</span></div>
          </div>
          <Button
            className="w-full"
            disabled={!!busy}
            onClick={() => activate("annual_paid", t("paywall.yearly"))}
          >
            {busy === t("paywall.yearly") ? t("paywall.activating") : t("paywall.getYearly")}
          </Button>
        </Card>

        {!isNative && (
          <Button
            variant="outline"
            className="w-full"
            disabled={!!busy}
            onClick={() => activate("monthly_paid", t("paywall.freeTrialLabel"))}
          >
            <Check className="h-4 w-4 mr-2" />
            {busy === t("paywall.freeTrialLabel") ? t("paywall.activating") : t("paywall.freeTrial")}
          </Button>
        )}

        {isNative && (
          <Button
            variant="ghost"
            className="w-full"
            disabled={!!busy}
            onClick={handleRestore}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {busy === "restore" ? "..." : "Restore purchases"}
          </Button>
        )}

        <div className="flex items-center justify-center gap-3 text-[11px]">
          <a
            href="/terms"
            onClick={(e) => { e.preventDefault(); navigate({ to: "/terms" }); }}
            className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Terms of Use (EULA)
          </a>
          <span className="text-muted-foreground">·</span>
          <a
            href="/privacy"
            onClick={(e) => { e.preventDefault(); navigate({ to: "/privacy" }); }}
            className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}
