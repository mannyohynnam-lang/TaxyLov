import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import ws from "ws";
import type { Database } from "@/integrations/supabase/types";
import taxGuide from "../../../assets/ie-tax-guide.txt?raw";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
} as const;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const InputSchema = z.object({
  description: z.string().min(1).max(500),
  period: z.enum(["daily", "yearly"]),
  categories: z
    .array(
      z.object({
        code: z.string().max(40),
        label: z.string().max(120),
        scope: z.enum(["daily", "yearly", "both"]).optional(),
      }),
    )
    .min(1)
    .max(200),
});

// Simple utility function to handle exponential backoff delays
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const Route = createFileRoute("/api/public/suggest-category")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        try {
          const authHeader = request.headers.get("authorization") ?? "";
          const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
          if (!token) return json({ error: "Missing authorization token" }, 401);

          const apiKey = process.env.GOOGLE_AI_API_KEY;
          if (!apiKey) return json({ error: "GOOGLE_AI_API_KEY is not configured" }, 500);

          const supabaseUrl = process.env.SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
          if (!supabaseUrl || !supabaseKey) {
            return json({ error: "Backend auth configuration is missing" }, 500);
          }

          const data = InputSchema.parse(await request.json().catch(() => ({})));
          const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
            global: { headers: { Authorization: `Bearer ${token}` } },
            realtime: { transport: ws },
          });

          const { data: userData, error: userError } = await supabase.auth.getUser(token);
          if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);

          const { data: profile } = await supabase
            .from("profiles")
            .select("business_type, business_area")
            .eq("id", userData.user.id)
            .maybeSingle();

          const businessLine =
            profile?.business_type || profile?.business_area
              ? `User's business: type=${profile?.business_type ?? "unknown"}, area=${profile?.business_area ?? "unknown"}. Use this context to bias toward categories that are typical and deductible for this trade (e.g. STOCK/MATERIALS for goods sellers, SUBCON_OTHER/PROF_FEES for service providers).`
              : "User's business profile is not set; do not bias toward any specific trade.";

          const list = data.categories
            .map((c) => `- ${c.code} [${c.scope ?? "both"}]: ${c.label}`)
            .join("\n");

          const system =
            "You classify a short transaction description into ONE accounting category code from the provided list. " +
            "Use the Irish Sole Trader Tax Guide (2025/2026) below as your authoritative reference for what counts as a deductible expense, capital allowance item, VAT treatment, and category mapping. " +
            "Also factor in the user's business type and area to pick the most plausible category for that trade. " +
            "Consider ALL categories regardless of their scope (daily/yearly/both) and pick the single best match. " +
            "Reply with ONLY the code, nothing else.\n\n" +
            "=== USER BUSINESS CONTEXT ===\n" +
            businessLine +
            "\n=== END BUSINESS CONTEXT ===\n\n" +
            "=== IRISH SOLE TRADER TAX GUIDE (REFERENCE) ===\n" +
            taxGuide +
            "\n=== END OF GUIDE ===";
          const user = `Current tab: ${data.period} (informational only — pick from ANY scope)\nDescription: "${data.description}"\n\nAllowed categories (code [scope]: label):\n${list}\n\nReply with one code only.`;

          let res: Response | null = null;
          const maxRetries = 3;
          let currentDelay = 500; // start with 500ms sleep

          // Retry loop specifically for 429 rate bounds from cloud IPs
          for (let attempt = 0; attempt <= maxRetries; attempt++) {
            res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  systemInstruction: { parts: [{ text: system }] },
                  contents: [{ role: "user", parts: [{ text: user }] }],
                  generationConfig: { temperature: 0.1, maxOutputTokens: 50 },
                }),
              },
            );

            // If we succeed, or get an un-retryable error like a 401 or 400, break out
            if (res.status !== 429 || attempt === maxRetries) {
              break;
            }

            console.warn(
              `[suggest-category] AI rate limited (429). Retrying in ${currentDelay}ms... (Attempt ${attempt + 1}/${maxRetries})`,
            );
            await delay(currentDelay);
            currentDelay *= 2; // double the wait time for the next block
          }

          if (!res || !res.ok) {
            const errText = res ? await res.text().catch(() => "") : "No response context";
            const status = res ? res.status : 502;
            console.error("[suggest-category] AI error", status, errText.slice(0, 500));

            if (status === 429) {
              return json(
                {
                  error:
                    "AI busy due to high infrastructure volume. Please retry your classification momentarily.",
                },
                429,
              );
            }
            if (status === 402) {
              return json(
                { error: "AI credits exhausted. Add credits in Workspace → Usage." },
                402,
              );
            }
            return json({ error: `AI request failed: ${status}: ${errText.slice(0, 200)}` }, 502);
          }

          const aiJson = (await res.json()) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          };
          const raw = (aiJson.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
          const cleaned = raw.replace(/[`"'\s.]/g, "").toUpperCase();
          const allowed = new Set(data.categories.map((c) => c.code.toUpperCase()));
          const match =
            (allowed.has(cleaned) && cleaned) ||
            data.categories.find((c) => cleaned.includes(c.code.toUpperCase()))?.code ||
            data.categories[0].code;

          return json({ code: match });
        } catch (error) {
          console.error("[suggest-category] handler error", error);
          if (error instanceof z.ZodError) return json({ error: "Invalid request payload" }, 400);
          return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
        }
      },
    },
  },
});
