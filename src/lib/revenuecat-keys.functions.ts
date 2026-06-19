import { createServerFn } from "@tanstack/react-start";

/**
 * Returns the RevenueCat *public* SDK keys (appl_… / goog_…).
 * These are embedded in mobile app binaries by design — not secret.
 * Stored as runtime secrets so they aren't committed to the repo.
 */
export const getRevenueCatPublicKeys = createServerFn({ method: "GET" }).handler(
  async () => {
    return {
      ios: process.env.REVENUECAT_IOS_PUBLIC_KEY ?? "",
      android: process.env.REVENUECAT_ANDROID_PUBLIC_KEY ?? "",
    };
  },
);
