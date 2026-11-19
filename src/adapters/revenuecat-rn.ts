/**
 * RevenueCat React Native Adapter for Consumables
 *
 * Wraps react-native-purchases for consumable credit purchases.
 * Lazy loads the SDK with try/catch for environments where it's not installed.
 *
 * This is the REACT NATIVE implementation of consumables_client's
 * `ConsumablesAdapter` seam. It lives here (not in consumables_client) so the
 * platform-agnostic business logic never pulls in react-native-purchases /
 * react-native. Inject it via
 * `initializeConsumables({ adapter: createConsumablesRNAdapter() })`.
 *
 * It follows the web adapter (@sudobility/consumables_pages'
 * `revenuecat-web.ts`) rule for rule: the catalog can be read before anybody
 * signs in, a purchase cannot be made until a user is set, and both refuse
 * with the same messages when the adapter was never given a key. An API that
 * verifies a purchase looks the transaction up under the buyer's own id, so
 * one made as the SDK's anonymous user would be paid for and never credited.
 */

import { Platform } from 'react-native';
import type {
  ConsumablePurchaseParams,
  ConsumablePurchaseResult,
  ConsumablesAdapter,
  CreditPackage,
  ProductMetadata,
} from '@sudobility/consumables_client';

let apiKey: string | null = null;
/** The user the SDK is logged in as. */
let currentUserId: string | null = null;
/**
 * The user the host last asked for. The web adapter becomes that user by
 * configuring the SDK, which cannot fail; here it takes a `logIn`, which is a
 * network call and can. So the request is remembered, and a purchase tries
 * the login again rather than staying refused until the app restarts.
 */
let requestedUser: { userId: string; email?: string } | null = null;
let isConfigured = false;
let pendingUserSetup: string | null = null;

/** Configure the RN adapter with RevenueCat API key. */
export function configureConsumablesRNAdapter(revenueCatApiKey: string): void {
  apiKey = revenueCatApiKey;
}

/**
 * Loads the SDK. `react-native-purchases` is a CommonJS module whose API
 * (`configure`, `getOfferings`, `logIn`, …) is the static side of its default
 * export; a bare `require` returns the module namespace, which holds only the
 * enums and error classes beside it.
 */
function getRNPurchases(): any {
  let sdk: any;
  try {
    sdk = require('react-native-purchases');
  } catch {
    throw new Error('react-native-purchases is not installed');
  }
  return sdk?.default ?? sdk;
}

async function ensureConfigured(requireUser = false): Promise<any> {
  if (!apiKey) throw new Error('RevenueCat not configured');
  if (requireUser && !currentUserId) {
    throw new Error('RevenueCat user not set');
  }

  const Purchases = getRNPurchases();

  if (!isConfigured) {
    Purchases.configure({ apiKey });
    isConfigured = true;
  }

  return Purchases;
}

/** Set the current user for RevenueCat RN. */
export async function setConsumablesRNUser(
  userId: string,
  email?: string
): Promise<void> {
  if (!apiKey) return;
  requestedUser = { userId, email };
  if (currentUserId === userId) return;
  if (pendingUserSetup === userId) return;

  pendingUserSetup = userId;
  try {
    const Purchases = await ensureConfigured();

    if (currentUserId) {
      await Purchases.logOut();
      // Nobody is logged in from here until `logIn` succeeds: a purchase in
      // between, or after a failed login, must not pass for the old user's.
      currentUserId = null;
    }

    await Purchases.logIn(userId);
    currentUserId = userId;

    if (email) {
      try {
        await Purchases.setAttributes({ email });
      } catch {
        // Ignore attribute errors
      }
    }
  } finally {
    pendingUserSetup = null;
  }
}

/** Clear the current user (on logout). */
export async function clearConsumablesRNUser(): Promise<void> {
  // Nothing to log out of unless this adapter logged somebody in: the SDK
  // refuses to log out an anonymous user, or to do anything unconfigured.
  if (isConfigured && currentUserId) {
    try {
      await getRNPurchases().logOut();
    } catch {
      // SDK not available, or already anonymous
    }
  }
  currentUserId = null;
  requestedUser = null;
}

/** Check if a user is configured. */
export function hasConsumablesRNUser(): boolean {
  return currentUserId !== null && isConfigured;
}

/** Create the consumables adapter for React Native. */
export function createConsumablesRNAdapter(): ConsumablesAdapter {
  return {
    async setUserId(userId: string | undefined, email?: string): Promise<void> {
      if (userId) {
        await setConsumablesRNUser(userId, email);
      } else {
        await clearConsumablesRNUser();
      }
    },

    async getOfferings() {
      try {
        const Purchases = await ensureConfigured(false);
        const offerings = await Purchases.getOfferings();

        const all: Record<
          string,
          {
            identifier: string;
            metadata: Record<string, unknown> | null;
            packages: CreditPackage[];
          }
        > = {};

        for (const [key, offering] of Object.entries(offerings.all) as [
          string,
          any,
        ][]) {
          all[key] = {
            identifier: offering.identifier,
            metadata: offering.metadata || null,
            packages: offering.availablePackages.map((pkg: any) => {
              const metadata = (pkg.product?.metadata ?? {}) as ProductMetadata;
              const credits =
                typeof metadata.credits === 'number' ? metadata.credits : 0;
              return {
                packageId: pkg.identifier,
                productId: pkg.product?.identifier || '',
                title: pkg.product?.title || '',
                description: pkg.product?.description || null,
                credits,
                price: pkg.product?.price || 0,
                priceString: pkg.product?.priceString || '$0',
                currencyCode: pkg.product?.currencyCode || 'USD',
              } satisfies CreditPackage;
            }),
          };
        }

        return { all };
      } catch (error) {
        console.error('[consumables-rn] Failed to get offerings:', error);
        throw error instanceof Error
          ? error
          : new Error('Unable to load RevenueCat offerings');
      }
    },

    async purchase(
      params: ConsumablePurchaseParams
    ): Promise<ConsumablePurchaseResult> {
      // A login that failed when the user signed in -- the device was offline
      // -- is tried once more before the purchase is refused for want of one.
      if (apiKey && !currentUserId && requestedUser) {
        await setConsumablesRNUser(requestedUser.userId, requestedUser.email);
      }
      const Purchases = await ensureConfigured(true);
      const offerings = await Purchases.getOfferings();

      let packageToPurchase: any;
      const selectedOffering = (offerings.all as any)[params.offeringId];
      for (const offering of (selectedOffering
        ? [selectedOffering]
        : Object.values(offerings.all)) as any[]) {
        packageToPurchase = offering.availablePackages.find(
          (pkg: any) => pkg.identifier === params.packageId
        );
        if (packageToPurchase) break;
      }

      if (!packageToPurchase) {
        throw new Error(`Package not found: ${params.packageId}`);
      }

      const result = await Purchases.purchasePackage(packageToPurchase);
      const metadata = (packageToPurchase.product?.metadata ||
        {}) as ProductMetadata;
      const credits =
        typeof metadata.credits === 'number' ? metadata.credits : 0;

      const nonSubTransactions =
        result.customerInfo?.nonSubscriptionTransactions || [];
      const latestTransaction =
        nonSubTransactions[nonSubTransactions.length - 1];
      const transactionId =
        latestTransaction?.transactionIdentifier || `rn_${Date.now()}`;

      // Determine source based on platform: the App Store bills on iOS and
      // macOS alike.
      const platform: 'apple' | 'google' =
        Platform.OS === 'ios' || Platform.OS === 'macos' ? 'apple' : 'google';

      return {
        transactionId,
        productId: packageToPurchase.product?.identifier || '',
        credits,
        priceCents: Math.round((packageToPurchase.product?.price || 0) * 100),
        currency: packageToPurchase.product?.currencyCode || 'USD',
        source: platform,
      };
    },
  };
}
