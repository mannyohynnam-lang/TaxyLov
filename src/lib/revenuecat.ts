import { getRevenueCatPublicKeys } from "./revenuecat-keys.functions";

// RevenueCat entitlement identifier — must match what you configure in the RC dashboard.
export const ENTITLEMENT_ID = "premium";

// RevenueCat product / offering package identifiers
export const PACKAGE_MONTHLY = "$rc_monthly";
export const PACKAGE_ANNUAL = "$rc_annual";

let initPromise: Promise<boolean> | null = null;

function isNative(): boolean {
  if (typeof window === "undefined") return false;
  // Capacitor injects this global when running inside the native shell
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } }).Capacitor;
  return !!cap?.isNativePlatform?.();
}

export function getPlatform(): "ios" | "android" | "web" {
  if (typeof window === "undefined") return "web";
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  const p = cap?.getPlatform?.();
  if (p === "ios" || p === "android") return p;
  return "web";
}

/** Initialise the RevenueCat SDK. No-op on web. Safe to call repeatedly. */
export async function initRevenueCat(userId?: string): Promise<boolean> {
  if (!isNative()) return false;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { Purchases, LOG_LEVEL } = await import("@revenuecat/purchases-capacitor");
    const keys = await getRevenueCatPublicKeys();
    const platform = getPlatform();
    const apiKey = platform === "ios" ? keys.ios : keys.android;
    if (!apiKey) {
      console.warn("[RevenueCat] No public key configured for", platform);
      return false;
    }
    await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
    await Purchases.configure({ apiKey, appUserID: userId });
    return true;
  })();

  return initPromise;
}

/** Identify the current Supabase user with RevenueCat (call after login). */
export async function identifyRevenueCatUser(userId: string): Promise<void> {
  if (!isNative()) return;
  const ok = await initRevenueCat(userId);
  if (!ok) return;
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  await Purchases.logIn({ appUserID: userId });
}

export async function logOutRevenueCat(): Promise<void> {
  if (!isNative()) return;
  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    await Purchases.logOut();
  } catch {
    /* not configured yet */
  }
}

export type Offering = {
  monthly?: { identifier: string; priceString: string; raw: unknown };
  annual?: { identifier: string; priceString: string; raw: unknown };
};

export async function getOfferings(): Promise<Offering | null> {
  if (!isNative()) return null;
  const ok = await initRevenueCat();
  if (!ok) return null;
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  const { current } = await Purchases.getOfferings();
  if (!current) return null;
  return {
    monthly: current.monthly
      ? {
          identifier: current.monthly.identifier,
          priceString: current.monthly.product.priceString,
          raw: current.monthly,
        }
      : undefined,
    annual: current.annual
      ? {
          identifier: current.annual.identifier,
          priceString: current.annual.product.priceString,
          raw: current.annual,
        }
      : undefined,
  };
}

/** Purchase a package. Returns true if the user now has the entitlement. */
export async function purchasePackage(pkg: unknown): Promise<boolean> {
  if (!isNative()) throw new Error("In-app purchases are only available on iOS and Android.");
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  const result = await Purchases.purchasePackage({ aPackage: pkg as Parameters<typeof Purchases.purchasePackage>[0]["aPackage"] });
  return !!result.customerInfo.entitlements.active[ENTITLEMENT_ID];
}

export async function restorePurchases(): Promise<boolean> {
  if (!isNative()) return false;
  const ok = await initRevenueCat();
  if (!ok) return false;
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  const { customerInfo } = await Purchases.restorePurchases();
  return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
}

export async function hasActiveEntitlement(): Promise<boolean> {
  if (!isNative()) return false;
  const ok = await initRevenueCat();
  if (!ok) return false;
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  const { customerInfo } = await Purchases.getCustomerInfo();
  return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
}
