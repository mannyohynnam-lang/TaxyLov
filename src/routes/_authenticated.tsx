import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: AuthGuard,
});

function AuthGuard() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    const check = async (session: unknown) => {
      if (!session) {
        setAuthed(false);
        setReady(true);
        await navigate({ to: "/auth", replace: true });
        return;
      }
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("status, business_type, business_area")
          .eq("id", u.user.id)
          .maybeSingle();
        if (!prof || prof.status === "not_paid") {
          if (window.location.pathname !== "/paywall") {
            await navigate({ to: "/paywall", replace: true });
            return;
          }
        } else if (!prof.business_type || !prof.business_area) {
          if (window.location.pathname !== "/onboarding") {
            await navigate({ to: "/onboarding", replace: true });
            return;
          }
        }
      }
      setAuthed(true);
      setReady(true);
    };
    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      check(session);
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);
  if (!ready) return null;
  if (!authed) return null;
  return <Outlet />;
}
