import { View, Text, TouchableOpacity } from 'react-native';
import {
  usePurchaseHistory,
  useUsageHistory,
} from '@sudobility/consumables_client';
import type {
  PurchaseHistoryPageFormatters,
  PurchaseHistoryPageLabels,
  UsageHistoryPageFormatters,
  UsageHistoryPageLabels,
} from './types';
import { PurchaseHistoryPage } from './PurchaseHistoryPage';
import { UsageHistoryPage } from './UsageHistoryPage';
import { primaryButtonClass, primaryButtonTextClass } from './controls';

export interface CreditHistoryPageProps {
  purchaseLabels: PurchaseHistoryPageLabels;
  purchaseFormatters: PurchaseHistoryPageFormatters;
  usageLabels: UsageHistoryPageLabels;
  usageFormatters: UsageHistoryPageFormatters;
  pageSize?: number;
  onPurchaseCredits?: () => void;
  purchaseButtonLabel?: string;
  className?: string;
}

/** Shared credit ledger view, including loading and pagination state for both history feeds. */
export function CreditHistoryPage({
  purchaseLabels,
  purchaseFormatters,
  usageLabels,
  usageFormatters,
  pageSize = 50,
  onPurchaseCredits,
  purchaseButtonLabel,
  className,
}: CreditHistoryPageProps) {
  const purchases = usePurchaseHistory(pageSize);
  const usages = useUsageHistory(pageSize);
  const hasMore = (count: number) => count > 0 && count % pageSize === 0;
  const isLoading = purchases.isLoading || usages.isLoading;

  return (
    <View className={className ?? 'gap-8'}>
      {onPurchaseCredits && (
        <View className='items-end'>
          <TouchableOpacity
            accessibilityRole='button'
            className={primaryButtonClass()}
            onPress={onPurchaseCredits}
          >
            <Text className={primaryButtonTextClass()}>
              {purchaseButtonLabel ?? 'Purchase credits'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <PurchaseHistoryPage
        purchases={purchases.purchases}
        isLoading={isLoading}
        error={purchases.error?.message ?? usages.error?.message ?? null}
        onLoadMore={() => void purchases.loadMore()}
        hasMore={hasMore(purchases.purchases.length)}
        labels={purchaseLabels}
        formatters={purchaseFormatters}
      />
      <UsageHistoryPage
        usages={usages.usages}
        isLoading={isLoading}
        error={purchases.error?.message ?? usages.error?.message ?? null}
        onLoadMore={() => void usages.loadMore()}
        hasMore={hasMore(usages.usages.length)}
        labels={usageLabels}
        formatters={usageFormatters}
      />
    </View>
  );
}
