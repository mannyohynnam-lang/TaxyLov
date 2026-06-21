import { createFileRoute } from "@tanstack/react-router";

// Public HTTPS endpoint reachable from capacitor://localhost (no auth gate
// because callers are native apps with no Supabase bearer at this layer;
// the file URL is a short-lived signed URL the caller already had to
// generate while authenticated).
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

type CategorizeBody = { fileUrl?: unknown; fileType?: unknown };

export const Route = createFileRoute("/api/public/categorize-file")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),

      POST: async ({ request }) => {
        try {
          const apiKey = process.env.GOOGLE_AI_API_KEY;
          if (!apiKey) return json({ error: "GOOGLE_AI_API_KEY not configured" }, 500);

          const body = (await request.json().catch(() => ({}))) as CategorizeBody;
          const fileUrl = typeof body.fileUrl === "string" ? body.fileUrl : "";
          const fileType = typeof body.fileType === "string" ? body.fileType : "";

          if (!/^https?:\/\//.test(fileUrl)) {
            return json({ error: "fileUrl must be an http(s) URL" }, 400);
          }

          // Fetch the file into memory
          const fileRes = await fetch(fileUrl);
          if (!fileRes.ok) {
            return json({ error: `Failed to fetch file: ${fileRes.status}` }, 400);
          }
          const contentType =
            fileType || fileRes.headers.get("content-type") || "application/octet-stream";
          const buf = new Uint8Array(await fileRes.arrayBuffer());
          if (buf.byteLength > 8 * 1024 * 1024) {
            return json({ error: "File too large (max 8MB)" }, 413);
          }

          const isImage = contentType.startsWith("image/");
          const isPdf = contentType === "application/pdf";

          // Build multimodal content blocks for the gateway
          let userContent: Array<Record<string, unknown>>;
          const promptText =
            "You categorize the attached file. Return ONLY a JSON object: " +
            '{"category":"<short category name>","reason":"<one sentence why it fits>"}. ' +
            "No markdown, no code fences.";

          if (isImage) {
            // base64 data URL
            let bin = "";
            for (let i = 0; i < buf.byteLength; i++) bin += String.fromCharCode(buf[i]);
            const b64 = btoa(bin);
            userContent = [
              { type: "text", text: promptText },
              { type: "image_url", image_url: { url: `data:${contentType};base64,${b64}` } },
            ];
          } else if (isPdf) {
            let bin = "";
            for (let i = 0; i < buf.byteLength; i++) bin += String.fromCharCode(buf[i]);
            const b64 = btoa(bin);
            userContent = [
              { type: "text", text: promptText },
              {
                type: "file",
                file: { filename: "document.pdf", file_data: `data:application/pdf;base64,${b64}` },
              },
            ];
          } else {
            // treat as text
            const text = new TextDecoder("utf-8", { fatal: false }).decode(buf).slice(0, 20000);
            userContent = [
              { type: "text", text: `${promptText}\n\n=== FILE CONTENT ===\n${text}` },
            ];
          }

          const aiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gemini-2.0-flash",
              messages: [
                {
                  role: "system",
                  content:
                    'You output strict JSON: {"category":"...","reason":"..."}. No prose.',
                },
                { role: "user", content: userContent },
              ],
            }),
          });

          if (aiRes.status === 429) return json({ error: "AI is busy. Try again." }, 429);
          if (aiRes.status === 402)
            return json({ error: "AI credits exhausted. Add credits in Workspace → Usage." }, 402);
          if (!aiRes.ok) {
            const errText = await aiRes.text().catch(() => "");
            console.error("[categorize-file] gateway error", aiRes.status, errText);
            return json({ error: `AI gateway error ${aiRes.status}` }, 502);
          }

          const data = (await aiRes.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const raw = (data.choices?.[0]?.message?.content ?? "").trim();
          let parsed: { category?: unknown; reason?: unknown } = {};
          try {
            parsed = JSON.parse(raw);
          } catch {
            // strip fences if any
            const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
            try {
              parsed = JSON.parse(cleaned);
            } catch {
              return json({ error: "Model returned non-JSON", raw }, 502);
            }
          }

          const category = typeof parsed.category === "string" ? parsed.category : "Unknown";
          const reason = typeof parsed.reason === "string" ? parsed.reason : "";
          return json({ category, reason });
        } catch (err) {
          console.error("[categorize-file] handler error", err);
          return json(
            { error: err instanceof Error ? err.message : "Unknown error" },
            500,
          );
        }
      },
    },
  },
});
