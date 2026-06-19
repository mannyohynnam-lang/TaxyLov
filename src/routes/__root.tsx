import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider, useT } from "@/lib/i18n";

function NotFoundComponent() {
  const { t } = useT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t("err.404")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("err.404Body")}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("err.goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const { t } = useT();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{t("err.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("err.body")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("err.tryAgain")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t("err.goHome")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" },
      { title: "Taxy – Form 11 Extract from Accounts" },
      { name: "description", content: "Mobile calculator for Irish self-employed Form 11 tax returns. Track daily transactions and generate Revenue-ready figures." },
      { name: "author", content: "Taxy" },
      { property: "og:title", content: "Taxy – Form 11 Extract from Accounts" },
      { property: "og:description", content: "Mobile calculator for Irish self-employed Form 11 tax returns. Track daily transactions and generate Revenue-ready figures." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Taxy – Form 11 Extract from Accounts" },
      { name: "twitter:description", content: "Mobile calculator for Irish self-employed Form 11 tax returns. Track daily transactions and generate Revenue-ready figures." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/35df8ee0-7691-45b5-b391-57e546f22adf/id-preview-e809cb1b--aad517ea-ee1c-4039-a94b-f7ff16129f9b.lovable.app-1778708083271.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/35df8ee0-7691-45b5-b391-57e546f22adf/id-preview-e809cb1b--aad517ea-ee1c-4039-a94b-f7ff16129f9b.lovable.app-1778708083271.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");

        if (!mounted || !Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") return;

        document.body.classList.add("is-ios-native");
        document.documentElement.classList.add("is-ios-native");
      } catch (error) {
        console.warn("iOS safe-area setup failed", error);
      }
    })();

    return () => {
      mounted = false;
      document.body.classList.remove("is-ios-native");
      document.documentElement.classList.remove("is-ios-native");
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <Outlet />
        <Toaster />
      </LanguageProvider>
    </QueryClientProvider>
  );
}
