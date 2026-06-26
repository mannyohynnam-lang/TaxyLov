// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";
import path from "path";

// Load .env vars into process.env — but never overwrite secrets already injected
// by the host environment (Replit secrets take priority over .env file values).
const serverEnv = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");
for (const [key, value] of Object.entries(serverEnv)) {
  if (!(key in process.env)) {
    process.env[key] = value;
  }
}

// Mirror the real server-side Supabase secrets as VITE_* so the browser client
// always talks to the same project the server validates tokens against.
if (process.env.SUPABASE_URL) {
  process.env.VITE_SUPABASE_URL = process.env.SUPABASE_URL;
}
if (process.env.SUPABASE_PUBLISHABLE_KEY) {
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
}

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
//
// IMPORTANT: SPA mode is OPT-IN via BUILD_TARGET=capacitor. Enabling it globally
// strips server functions (createServerFn) from the Cloudflare Worker build,
// breaking AI assistant, auth-protected RPCs, etc. Only enable for native builds.
const isCapacitorBuild = process.env.BUILD_TARGET === "capacitor";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    ...(isCapacitorBuild
      ? {
          spa: {
            enabled: true,
            prerender: { outputPath: "/index" },
          },
          // Disable prerendering for Capacitor builds. Prerendered HTML causes
          // React hydration errors (#422) in WKWebView because the server-rendered
          // content doesn't match the Capacitor runtime environment. With
          // prerendering off, TanStack Start emits a plain CSR shell — no SSR
          // content, no hydration step, no mismatch.
          prerender: { enabled: false },
        }
      : {}),
  },
  vite: {
    ...(isCapacitorBuild ? { base: "./" } : {}),
    server: {
      host: "0.0.0.0",
      port: 5000,
      strictPort: true,
      allowedHosts: true,
    },
    resolve: {
      alias: {
        "entities/lib/decode.js": path.resolve(__dirname, "node_modules/entities/lib/decode.js"),
        "entities/lib/encode.js": path.resolve(__dirname, "node_modules/entities/lib/encode.js"),
        "entities": path.resolve(__dirname, "node_modules/entities"),
      },
    },
  },
});
