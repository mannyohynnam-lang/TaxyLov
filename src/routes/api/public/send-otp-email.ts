  import { createFileRoute } from "@tanstack/react-router";
  import * as React from "react";
  import { render } from "@react-email/components";
  import { z } from "zod";
  import { createClient } from "@supabase/supabase-js";
  import ws from "ws";

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  } as const;

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  const InputSchema = z.object({
    email: z.string().email(),
  });

  export const Route = createFileRoute("/api/public/send-otp-email")({
    server: {
      handlers: {
        OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
        POST: async ({ request }) => {
          try {
            const resendKey = process.env.RESEND_API_KEY;
            const supabaseUrl = process.env.SUPABASE_URL;
            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

            if (!resendKey || !supabaseUrl || !serviceRoleKey) {
              console.error("[send-otp-email] Missing env vars");
              return json({ error: "Server configuration error" }, 500);
            }

            const { email } = InputSchema.parse(await request.json().catch(() => ({})));

            // Use the admin client to generate an OTP for this email.
            // generateLink creates a magic link and we extract the token from it.
            const admin = createClient(supabaseUrl, serviceRoleKey, {
              auth: { autoRefreshToken: false, persistSession: false },
              realtime: { transport: ws },
            });

            // First ensure the user exists (createUser is idempotent — no-op if already exists)
            await admin.auth.admin.createUser({ email, email_confirm: true }).catch(() => {});

            const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
              type: "magiclink",
              email,
            });

            if (linkError || !linkData?.properties?.hashed_token) {
              console.error("[send-otp-email] generateLink error", linkError);
              return json({ error: "Failed to generate sign-in link" }, 500);
            }

            // Extract the 6-digit OTP from the email_otp field if available,
            // otherwise use the full hashed_token for magic-link style verification.
            const otp = linkData.properties.email_otp ?? null;
            const tokenHash = linkData.properties.hashed_token;

            // Build the email body
            const OtpEmail = ({ code, magicLink }: { code: string | null; magicLink: string }) =>
              React.createElement(
                "html",
                { lang: "en" },
                React.createElement(
                  "body",
                  { style: { backgroundColor: "#f6f9fc", fontFamily: "Arial, sans-serif", padding: "40px 20px" } },
                  React.createElement(
                    "div",
                    { style: { backgroundColor: "#ffffff", borderRadius: "12px", padding: "32px", maxWidth: "480px", margin: "0 auto" } },
                    React.createElement("h1", { style: { fontSize: "22px", fontWeight: "bold", color: "#111", marginBottom: "8px" } }, "Your Taxy sign-in code"),
                    React.createElement("p", { style: { fontSize: "14px", color: "#555", marginBottom: "24px" } },
                      "Use the code below to sign in. It expires in 10 minutes."
                    ),
                    code
                      ? React.createElement(
                          "div",
                          { style: { backgroundColor: "#f0f4ff", borderRadius: "8px", padding: "20px", textAlign: "center", marginBottom: "24px" } },
                          React.createElement("span", { style: { fontFamily: "monospace", fontSize: "32px", fontWeight: "bold", letterSpacing: "0.2em", color: "#1a1a2e" } }, code)
                        )
                      : React.createElement(
                          "a",
                          { href: magicLink, style: { display: "inline-block", backgroundColor: "#1a1a2e", color: "#fff", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "14px" } },
                          "Sign in to Taxy"
                        ),
                    React.createElement("p", { style: { fontSize: "12px", color: "#999", marginTop: "24px" } },
                      "If you didn't request this, you can safely ignore this email."
                    )
                  )
                )
              );

            const appUrl = process.env.VITE_API_BASE_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
            const magicLink = `${appUrl}/auth/callback?token_hash=${tokenHash}&type=magiclink`;

            const html = await render(React.createElement(OtpEmail, { code: otp, magicLink }));
            const text = otp
              ? `Your Taxy sign-in code is: ${otp}\n\nIt expires in 10 minutes.`
              : `Sign in to Taxy: ${magicLink}`;

            const resendRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${resendKey}`,
              },
              body: JSON.stringify({
                from: "Taxy <Taxy-no-reply@resend.iwealthy.app>",
                to: [email],
                subject: "Your Taxy sign-in code",
                html,
                text,
              }),
            });

            if (!resendRes.ok) {
              const errText = await resendRes.text().catch(() => "");
              console.error("[send-otp-email] Resend error", resendRes.status, errText);
              return json({ error: `Email send failed: ${resendRes.status} ${errText.slice(0, 200)}` }, 502);
            }

            // Return whether it's OTP or magic-link so the client can show the right UI
            return json({ success: true, mode: otp ? "otp" : "magiclink", tokenHash: otp ? null : tokenHash });
          } catch (error) {
            console.error("[send-otp-email] error", error);
            if (error instanceof z.ZodError) return json({ error: "Invalid request" }, 400);
            return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
          }
        },
      },
    },
  });
