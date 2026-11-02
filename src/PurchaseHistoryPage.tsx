/**
 * @fileoverview Purchase history page with a card layout and load-more
 * pagination. Purely presentational -- data and callbacks come via props.
 */

import { View, Text, TouchableOpacity } from 'react-native';
import { designTokens } from '@sudobility/design';
import type { ConsumableSource } from '@sudobility/types';
import { LoadingSpinner } from './LoadingSpinner';
import { quietButtonClass, quietButtonTextClass } from './controls';
import type { PurchaseHistoryPageProps } from './types';

const { size, weight } = designTokens.typography;

/**
 * Renders a paginated list of purchase records as cards.
 * @param props - See {@link PurchaseHistoryPageProps} for full prop documentation.
 */
export function PurchaseHistoryPage({
  purchases,
  isLoading,
  error,
  onLoadMore,
  hasMore,
  labels,
  formatters,
  className,
  emptyStateComponent,
}: PurchaseHistoryPageProps) {
  return (
    <View className={className}>
      <Text
        className={[size['2xl'], weight.bold, 'mb-6 text-foreground'].join(' ')}
      >
        {labels.title}
      </Text>

      {error && (
        <View
          className='mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3'
          accessibilityRole='alert'
        >
          <Text className={[size.sm, 'text-destructive'].join(' ')}>
            {error}
          </Text>
        </View>
      )}

      {isLoading && <LoadingSpinner />}

      {!isLoading && purchases.length === 0 && (
        <>
          {emptyStateComponent ?? (
            <Text
              className={[
                size.sm,
                'py-8 text-center text-muted-foreground',
              ].join(' ')}
            >
              {labels.noRecords}
            </Text>
          )}
        </>
      )}

      {!isLoading && purchases.length > 0 && (
        <>
          <View className='gap-3'>
            {purchases.map(purchase => (
              <View
                key={purchase.id}
                className='rounded-lg border border-border bg-card p-4'
              >
                <View className='flex-row items-start justify-between'>
                  <View className='flex-1'>
                    <Text
                      className={[size.sm, 'text-muted-foreground'].join(' ')}
                    >
                      {formatters.formatDate(purchase.created_at)}
                    </Text>
                    <Text
                      className={[size.sm, 'text-muted-foreground'].join(' ')}
                    >
                      {formatters.formatSource(
                        purchase.source as ConsumableSource
                      )}
                    </Text>
                  </View>
                  <View className='items-end'>
                    <Text className={[weight.medium, 'text-success'].join(' ')}>
                      +{purchase.credits}
                    </Text>
                    {purchase.price_cents != null && purchase.currency && (
                      <Text
                        className={[size.sm, 'text-muted-foreground'].join(' ')}
                      >
                        {formatters.formatAmount(
                          purchase.price_cents,
                          purchase.currency
                        )}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>

          {hasMore && onLoadMore && (
            <View className='mt-4 items-center'>
              <TouchableOpacity
                onPress={onLoadMore}
                accessibilityRole='button'
                className={quietButtonClass()}
              >
                <Text className={quietButtonTextClass()}>
                  {labels.loadMore}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}
