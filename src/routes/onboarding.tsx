import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Briefcase, Package, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const BUSINESS_AREAS = [
  "Education",
  "Sport",
  "Food",
  "Cleaning",
  "Accounting",
  "Website creation",
  "Beauty",
  "Health & wellness",
  "Construction & trades",
  "Transport & delivery",
  "Retail",
  "Hospitality",
  "Consulting",
  "Marketing & design",
  "IT & software",
  "Photography & video",
  "Childcare",
  "Agriculture",
  "Repairs & maintenance",
  "Other",
];

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const { t } = useT();
  const [type, setType] = useState<"services" | "goods" | "">("");
  const [area, setArea] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        navigate({ to: "/auth" });
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("status, business_type, business_area")
        .eq("id", u.user.id)
        .maybeSingle();
      if (!prof || prof.status === "not_paid") {
        navigate({ to: "/paywall" });
        return;
      }
      if (prof.business_type && prof.business_area) {
        navigate({ to: "/" });
        return;
      }
      setReady(true);
    })();
  }, [navigate]);

  const save = async () => {
    if (!type || !area) {
      toast.error(t("onb.chooseBoth"));
      return;
    }
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setBusy(false);
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ business_type: type, business_area: area })
      .eq("id", u.user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("onb.saved"));
    navigate({ to: "/" });
  };

  if (!ready) return null;

  return (
    <div className="safe-area-page flex items-start justify-center bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Briefcase className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">{t("onb.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("onb.subtitle")}</p>
        </div>

        <Card className="p-5 space-y-5">
          <div className="space-y-2">
            <Label>{t("onb.type")}</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("services")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-md border p-4 text-sm transition-colors",
                  type === "services"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-background hover:bg-accent",
                )}
              >
                <Wrench className="h-5 w-5" />
                {t("onb.services")}
              </button>
              <button
                type="button"
                onClick={() => setType("goods")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-md border p-4 text-sm transition-colors",
                  type === "goods"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-background hover:bg-accent",
                )}
              >
                <Package className="h-5 w-5" />
                {t("onb.goods")}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">{t("onb.area")}</Label>
            <select
              id="area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{t("onb.chooseArea")}</option>
              {BUSINESS_AREAS.map((a) => (
                <option key={a} value={a}>
                  {t(`area.${a}` as any)}
                </option>
              ))}
            </select>
          </div>

          <Button className="w-full" disabled={busy} onClick={save}>
            {busy ? t("onb.saving") : t("onb.continue")}
          </Button>
        </Card>
      </div>
    </div>
  );
}
