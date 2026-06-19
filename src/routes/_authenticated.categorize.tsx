import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CategorizeFilePicker } from "@/components/CategorizeFilePicker";

export const Route = createFileRoute("/_authenticated/categorize")({
  component: CategorizePage,
});

function CategorizePage() {
  return (
    <AppShell title="Categorize" subtitle="AI file classification">
      <CategorizeFilePicker />
    </AppShell>
  );
}
