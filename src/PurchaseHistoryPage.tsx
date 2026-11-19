/**
 * @fileoverview Purchase history page component with responsive table (wide
 * windows) and card (narrow windows) layouts. Supports load-more pagination.
 */

import { View, Text, TouchableOpacity } from 'react-native';
import { designTokens } from '@sudobility/design';
import type { ConsumableSource } from '@sudobility/types';
import { LoadingSpinner } from './LoadingSpinner';
import { useBreakpoints } from './breakpoints';
import { cx, quietButtonClass, quietButtonTextClass } from './controls';
import type { PurchaseHistoryPageProps } from './types';

const { size, weight } = designTokens.typography;

/** A table cell: every column takes an equal share of the row. */
const CELL_CLASS = cx('flex-1 px-4 py-3', size.sm);
const HEADER_CELL_CLASS = cx(
  CELL_CLASS,
  weight.medium,
  'text-muted-foreground'
);

/**
 * Renders a paginated list of purchase records.
 * Wide windows (the web's `sm` breakpoint and up): table with date, credits,
 * source, and amount columns.
 * Narrow windows: compact card layout.
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
  const { sm: isWide } = useBreakpoints();

  return (
    <View className={className}>
      <Text
        className={cx(size['2xl'], weight.bold, 'mb-6 text-foreground')}
        accessibilityRole='header'
      >
        {labels.title}
      </Text>

      {error && (
        <View
          className='mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3'
          accessibilityRole='alert'
        >
          <Text className={cx(size.sm, 'text-destructive')}>{error}</Text>
        </View>
      )}

      {isLoading && <LoadingSpinner />}

      {!isLoading && purchases.length === 0 && (
        <>
          {emptyStateComponent ?? (
            <Text
              className={cx(
                size.base,
                'py-8 text-center text-muted-foreground'
              )}
            >
              {labels.noRecords}
            </Text>
          )}
        </>
      )}

      {!isLoading && purchases.length > 0 && (
        <>
          {isWide ? (
            /* Wide-window table */
            <View>
              <View className='flex-row border-b border-border'>
                <Text className={cx(HEADER_CELL_CLASS, 'text-left')}>
                  {labels.columnDate}
                </Text>
                <Text className={cx(HEADER_CELL_CLASS, 'text-right')}>
                  {labels.columnCredits}
                </Text>
                <Text className={cx(HEADER_CELL_CLASS, 'text-left')}>
                  {labels.columnSource}
                </Text>
                <Text className={cx(HEADER_CELL_CLASS, 'text-right')}>
                  {labels.columnAmount}
                </Text>
              </View>
              {purchases.map(purchase => (
                <View
                  key={purchase.id}
                  className='flex-row border-b border-border/50'
                >
                  <Text className={cx(CELL_CLASS, 'text-foreground')}>
                    {formatters.formatDate(purchase.created_at)}
                  </Text>
                  <Text
                    className={cx(
                      CELL_CLASS,
                      weight.medium,
                      'text-right text-success'
                    )}
                  >
                    +{purchase.credits}
                  </Text>
                  <Text className={cx(CELL_CLASS, 'text-muted-foreground')}>
                    {formatters.formatSource(
                      purchase.source as ConsumableSource
                    )}
                  </Text>
                  <Text
                    className={cx(
                      CELL_CLASS,
                      'text-right text-muted-foreground'
                    )}
                  >
                    {purchase.price_cents != null && purchase.currency
                      ? formatters.formatAmount(
                          purchase.price_cents,
                          purchase.currency
                        )
                      : '-'}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            /* Narrow-window cards */
            <View className='gap-3'>
              {purchases.map(purchase => (
                <View
                  key={purchase.id}
                  className='rounded-lg border border-border bg-card p-4'
                >
                  <View className='flex-row items-start justify-between'>
                    <View className='flex-1'>
                      <Text className={cx(size.sm, 'text-muted-foreground')}>
                        {formatters.formatDate(purchase.created_at)}
                      </Text>
                      <Text className={cx(size.sm, 'text-muted-foreground')}>
                        {formatters.formatSource(
                          purchase.source as ConsumableSource
                        )}
                      </Text>
                    </View>
                    <View className='items-end'>
                      <Text
                        className={cx(size.base, weight.medium, 'text-success')}
                      >
                        +{purchase.credits}
                      </Text>
                      {purchase.price_cents != null && purchase.currency && (
                        <Text className={cx(size.sm, 'text-muted-foreground')}>
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
          )}

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
