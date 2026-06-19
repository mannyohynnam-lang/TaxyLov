import { useT } from "@/lib/i18n";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useT();
  const btn = (l: "en" | "uk", label: string) => (
    <button
      type="button"
      onClick={() => setLang(l)}
      aria-pressed={lang === l}
      className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
        lang === l
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div className={`inline-flex items-center gap-0.5 rounded-lg border border-border bg-card/60 p-0.5 ${className}`}>
      {btn("en", "EN")}
      {btn("uk", "UK")}
    </div>
  );
}
