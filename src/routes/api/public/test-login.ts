import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const TEST_EMAIL = "vbdasha@gmail.com";
const TEST_CODE = "12345678";

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

export const Route = createFileRoute("/api/public/test-login")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        try {
          const supabaseUrl = process.env.SUPABASE_URL;
          const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (!supabaseUrl || !serviceRoleKey) {
            return json({ error: "Server configuration error" }, 500);
          }

          const body = await request.json().catch(() => ({})) as { email?: string; code?: string };

          if (body.email !== TEST_EMAIL || body.code !== TEST_CODE) {
            return json({ error: "Invalid test credentials" }, 403);
          }

          const admin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
            realtime: { transport: ws },
          });

          // Ensure test user exists
          const { data: existing } = await admin.auth.admin.listUsers();
          const exists = existing?.users?.some((u) => u.email === TEST_EMAIL);
          if (!exists) {
            await admin.auth.admin.createUser({ email: TEST_EMAIL, email_confirm: true });
          }

          const { data, error } = await admin.auth.admin.generateLink({
            type: "magiclink",
            email: TEST_EMAIL,
          });

          if (error || !data?.properties?.hashed_token) {
            console.error("[test-login] generateLink error", error);
            return json({ error: error?.message ?? "Failed to generate link" }, 500);
          }

          return json({ token_hash: data.properties.hashed_token });
        } catch (e) {
          console.error("[test-login] error", e);
          return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
        }
      },
    },
  },
});
