/**
 * Ready-to-use credit store connected to the RevenueCat adapter and the
 * consumables API. The adapter reads localized, purchasable packages from the
 * platform SDK; the API allowlists products and supplies authoritative credits.
 */
import {
  useBalance,
  useConsumableProducts,
  usePurchaseCredits,
} from '@sudobility/consumables_client';
import { CreditStorePage } from './CreditStorePage';
import type { CreditStorePageFormatters, CreditStorePageLabels } from './types';

export interface RevenueCatCreditStoreProps {
  offeringId: string;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  labels: CreditStorePageLabels;
  formatters: CreditStorePageFormatters;
  className?: string;
}

/** Loads RevenueCat products, performs purchases, and renders the shared store UI. */
export function RevenueCatCreditStore({
  offeringId,
  isAuthenticated,
  onLoginClick,
  labels,
  formatters,
  className,
}: RevenueCatCreditStoreProps) {
  const balance = useBalance();
  const products = useConsumableProducts(offeringId);
  const purchase = usePurchaseCredits();

  return (
    <CreditStorePage
      isAuthenticated={isAuthenticated}
      balance={balance.balance}
      packages={products.packages}
      isLoading={balance.isLoading || products.isLoading}
      isPurchasing={purchase.isPurchasing}
      error={
        purchase.error?.message ??
        balance.error?.message ??
        products.error?.message ??
        null
      }
      onPurchase={async packageId => {
        const selected = products.packages.find(
          pkg => pkg.packageId === packageId
        );
        await purchase.purchase(
          selected?.storePackageId ?? packageId,
          selected?.offeringId ?? offeringId
        );
      }}
      onLoginClick={onLoginClick}
      labels={labels}
      formatters={formatters}
      className={className}
    />
  );
}
