import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
// Irish Sole Trader Tax Guide 2025/2026 — used as reference knowledge for the AI assistant
import taxGuide from "../assets/ie-tax-guide.txt?raw";

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

export const suggestCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not configured");

    // Pull the user's business profile so suggestions match their trade.
    const { supabase } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_type, business_area")
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

    const res = await fetch(
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

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[suggestCategory] AI error", res.status, errText.slice(0, 500));
      if (res.status === 429) throw new Error("AI quota exceeded — the Google AI API key has no remaining quota. Please check the key in Settings.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Workspace → Usage.");
      throw new Error(`AI request failed: ${res.status} ${errText.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw = (json.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
    const cleaned = raw.replace(/[`"'\s.]/g, "").toUpperCase();

    const allowed = new Set(data.categories.map((c) => c.code.toUpperCase()));
    const match =
      (allowed.has(cleaned) && cleaned) ||
      data.categories.find((c) => cleaned.includes(c.code.toUpperCase()))?.code ||
      data.categories[0].code;

    return { code: match };
  });
