import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Result = { category: string; reason: string };

// Resolve the absolute URL to call. On Capacitor (capacitor://localhost),
// relative fetches don't reach our server — point to the published Worker.
// VITE_API_BASE_URL must be set to the deployed server URL when building for
// Capacitor (e.g. https://your-app.replit.app). Leave empty for web builds —
// a relative path is used and the same-origin server handles the request.
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

function resolveEndpoint(): string {
  if (typeof window === "undefined") return "/api/public/categorize-file";
  if (API_BASE) return `${API_BASE}/api/public/categorize-file`;
  const origin = window.location.origin;
  if (origin.startsWith("capacitor:") || origin.startsWith("http://localhost")) {
    console.warn("[CategorizeFilePicker] Running in Capacitor but VITE_API_BASE_URL is not set — requests will fail. Set it to your deployed server URL.");
  }
  return `${origin}/api/public/categorize-file`;
}

export function CategorizeFilePicker() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [endpoint, setEndpoint] = useState<string>("");

  // Defer any window-touching initialization to after mount to avoid
  // SSR/hydration mismatches (the root cause of React error #418).
  useEffect(() => {
    setEndpoint(resolveEndpoint());
  }, []);

  const onPick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    setBusy(true);
    setResult(null);
    setFileName(file.name);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error("You must be signed in.");
      const uid = userData.user.id;

      const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
      const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("analysis-files")
        .upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (upErr) throw upErr;

      // Short-lived signed URL the server can fetch
      const { data: signed, error: signErr } = await supabase.storage
        .from("analysis-files")
        .createSignedUrl(path, 300);
      if (signErr || !signed?.signedUrl) throw signErr ?? new Error("Signed URL failed");

      const res = await fetch(endpoint || resolveEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: signed.signedUrl, fileType: file.type }),
      });

      const json = (await res.json().catch(() => ({}))) as Partial<Result> & { error?: string };
      if (!res.ok) throw new Error(json.error || `Request failed: ${res.status}`);

      setResult({ category: json.category ?? "Unknown", reason: json.reason ?? "" });
      toast.success("File categorized");
    } catch (err) {
      console.error("[CategorizeFilePicker]", err);
      toast.error(err instanceof Error ? err.message : "Failed to categorize");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Upload className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">AI File Categorizer</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Upload an image, PDF, or text file. We'll classify it with AI.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf,text/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={onPick}
        disabled={busy}
        className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[.98] transition"
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" /> Choose file
          </>
        )}
      </button>

      {fileName && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {fileName.match(/\.(png|jpe?g|gif|webp|heic)$/i) ? (
            <ImageIcon className="h-3.5 w-3.5" />
          ) : (
            <FileText className="h-3.5 w-3.5" />
          )}
          <span className="truncate">{fileName}</span>
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-1">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-primary">
            Category
          </div>
          <div className="text-sm font-semibold">{result.category}</div>
          {result.reason && (
            <p className="text-xs text-muted-foreground leading-relaxed">{result.reason}</p>
          )}
        </div>
      )}
    </div>
  );
}
