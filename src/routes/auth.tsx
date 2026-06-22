import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CapacitorHttp } from "@capacitor/core";

// Must match the pattern used for suggest-category:
// VITE_API_BASE_URL must be set to the deployed https:// URL before a Capacitor build.
// On web, _API_BASE is "" so the path is relative ("/api/public/send-otp-email").
const _API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const SEND_OTP_ENDPOINT = `${_API_BASE}/api/public/send-otp-email`;

function isNativeOrigin(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.origin.startsWith("capacitor:");
}

type SendOtpResult = { tokenHash: string | null; error?: string };

async function callSendOtpEmail(email: string): Promise<SendOtpResult> {
  if (isNativeOrigin()) {
    if (!_API_BASE) throw new Error("VITE_API_BASE_URL is not set for this native build.");
    const res = await CapacitorHttp.post({
      url: SEND_OTP_ENDPOINT,
      headers: { "Content-Type": "application/json" },
      data: { email },
    });
    const json = res.data as { success?: boolean; tokenHash?: string; error?: string };
    if (res.status < 200 || res.status >= 300) return { tokenHash: null, error: json?.error ?? `Request failed: ${res.status}` };
    return { tokenHash: json?.tokenHash ?? null };
  }
  const res = await fetch(SEND_OTP_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const json = await res.json();
  if (!res.ok) return { tokenHash: null, error: json?.error ?? `Request failed: ${res.status}` };
  return { tokenHash: json?.tokenHash ?? null };
}

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  component: AuthPage,
});

const MAX_RESENDS = 3;
const COOLDOWN_SECONDS = 60;
const TEST_EMAIL = "vbdasha@gmail.com";
const TEST_CODE = "12345678";

function AuthPage() {
  const navigate = useNavigate();
  const { t } = useT();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCount, setResendCount] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [tokenHash, setTokenHash] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (!session) return;
      // Identify the user with RevenueCat on native (no-op on web)
      try {
        const { identifyRevenueCatUser } = await import("@/lib/revenuecat");
        await identifyRevenueCatUser(session.user.id);
      } catch (e) {
        console.warn("RC identify failed", e);
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("status, business_type, business_area")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!prof || prof.status === "not_paid") {
        navigate({ to: "/paywall" });
      } else if (!prof.business_type || !prof.business_area) {
        navigate({ to: "/onboarding" });
      } else {
        navigate({ to: "/" });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const sendOtp = useCallback(async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    // Test user bypass – skip real OTP send
    if (email.trim().toLowerCase() === TEST_EMAIL) {
      setLoading(false);
      setStep("otp");
      setCooldown(COOLDOWN_SECONDS);
      toast.success(t("auth.codeSent"));
      return;
    }

    try {
      const result = await callSendOtpEmail(email.trim());
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      if (result.tokenHash) setTokenHash(result.tokenHash);
      setLoading(false);
      setStep("otp");
      setCooldown(COOLDOWN_SECONDS);
      toast.success(t("auth.codeSent"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("auth.sendFailed"));
      setLoading(false);
    }
  }, [email, t]);

  const resendOtp = useCallback(async () => {
    if (resendCount >= MAX_RESENDS) {
      setError(t("auth.maxResends"));
      return;
    }
    if (cooldown > 0) return;
    setLoading(true);
    setError("");
    try {
      const result = await callSendOtpEmail(email.trim());
      setLoading(false);
      if (result.error) {
        setError(result.error);
      } else {
        if (result.tokenHash) setTokenHash(result.tokenHash);
        setResendCount((c) => c + 1);
        setCooldown(COOLDOWN_SECONDS);
        toast.success(t("auth.newCodeSent"));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("auth.sendFailed"));
      setLoading(false);
    }
  }, [email, resendCount, cooldown, t]);

  const verifyOtp = useCallback(async () => {
    if (!otp.trim()) return;
    setLoading(true);
    setError("");

    // Test user bypass – use edge function to mint a real session
    if (email.trim().toLowerCase() === TEST_EMAIL && otp.trim() === TEST_CODE) {
      try {
        const { data: fnData, error: fnError } = await supabase.functions.invoke("test-login", {
          body: { email: TEST_EMAIL, code: TEST_CODE },
        });
        if (fnError || !fnData?.token_hash) {
          setError(fnError?.message ?? t("auth.testFailed"));
          setLoading(false);
          return;
        }
        const { error: vErr } = await supabase.auth.verifyOtp({
          token_hash: fnData.token_hash,
          type: "magiclink",
        });
        setLoading(false);
        if (vErr) setError(vErr.message);
        return;
      } catch (e) {
        setLoading(false);
        setError(e instanceof Error ? e.message : t("auth.testFailed"));
        return;
      }
    }

    // If our server gave us a tokenHash (magiclink), verify by token_hash.
    // Otherwise fall back to standard email OTP verification.
    const { error: verifyError } = tokenHash
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" })
      : await supabase.auth.verifyOtp({ email: email.trim(), token: otp.trim(), type: "email" });
    setLoading(false);
    if (verifyError) {
      const msg = verifyError.message.toLowerCase();
      if (msg.includes("expired")) setError(t("auth.expired"));
      else if (msg.includes("invalid")) setError(t("auth.invalid"));
      else setError(verifyError.message);
    }
  }, [email, otp, t, tokenHash]);

  return (
    <div className="safe-area-page flex flex-col items-center bg-background relative">
      <div className="self-end">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm flex-1 flex flex-col justify-start pt-4">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{t("auth.brand")}</h1>
          <p className="text-muted-foreground mt-2 text-sm">{t("auth.subtitle")}</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {step === "email" ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Mail className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">{t("auth.emailTitle")}</h2>
                  <p className="text-xs text-muted-foreground">{t("auth.emailHint")}</p>
                </div>
              </div>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none mb-4"
                onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                autoComplete="email"
              />

              {error && <p className="text-destructive text-xs mb-3">{error}</p>}

              <button
                onClick={sendOtp}
                disabled={loading || !email.trim()}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  email.trim() && !loading
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {t("auth.sendCode")}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-1">{t("auth.codeSentTo")}</p>
              <p className="text-sm font-semibold text-foreground mb-4">{email}</p>

              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="00000000"
                maxLength={8}
                className="w-full bg-muted rounded-xl px-4 py-3 text-center text-lg font-mono tracking-[0.5em] text-foreground placeholder:text-muted-foreground placeholder:tracking-normal placeholder:text-sm outline-none mb-4"
                onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
              />

              {error && <p className="text-destructive text-xs mb-3">{error}</p>}

              <button
                onClick={verifyOtp}
                disabled={loading || otp.length < 8}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  otp.length >= 8 && !loading
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {t("auth.verifyContinue")}
              </button>

              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => { setStep("email"); setOtp(""); setError(""); setResendCount(0); setCooldown(0); setTokenHash(null); }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("auth.changeEmail")}
                </button>

                <button
                  onClick={resendOtp}
                  disabled={cooldown > 0 || resendCount >= MAX_RESENDS || loading}
                  className={`text-sm flex items-center gap-1 transition-colors ${
                    cooldown > 0 || resendCount >= MAX_RESENDS
                      ? "text-muted-foreground/50 cursor-not-allowed"
                      : "text-primary hover:text-primary/80"
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  {cooldown > 0
                    ? t("auth.resendIn", { s: cooldown })
                    : resendCount >= MAX_RESENDS
                      ? t("auth.limitReached")
                      : t("auth.resend")}
                </button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-3">
                {t("auth.enter6")}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
