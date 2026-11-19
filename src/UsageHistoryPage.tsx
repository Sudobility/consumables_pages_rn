/**
 * @fileoverview Usage history page component with responsive table (wide
 * windows) and card (narrow windows) layouts. Supports load-more pagination.
 */

import { View, Text, TouchableOpacity } from 'react-native';
import { designTokens } from '@sudobility/design';
import { LoadingSpinner } from './LoadingSpinner';
import { useBreakpoints } from './breakpoints';
import { cx, quietButtonClass, quietButtonTextClass } from './controls';
import type { UsageHistoryPageProps } from './types';

const { size, weight } = designTokens.typography;

/** A table cell: every column takes an equal share of the row. */
const CELL_CLASS = cx('flex-1 px-4 py-3', size.sm);
const HEADER_CELL_CLASS = cx(
  CELL_CLASS,
  weight.medium,
  'text-muted-foreground'
);

/**
 * Renders a paginated list of usage records.
 * Wide windows (the web's `sm` breakpoint and up): table with date,
 * description and (optionally) credits columns.
 * Narrow windows: compact card layout.
 * @param props - See {@link UsageHistoryPageProps} for full prop documentation.
 */
export function UsageHistoryPage({
  usages,
  isLoading,
  error,
  onLoadMore,
  hasMore,
  labels,
  formatters,
  className,
  emptyStateComponent,
}: UsageHistoryPageProps) {
  const { sm: isWide } = useBreakpoints();
  // Whichever the product sets. A file-based product fills `filename`; one that
  // spends credits on something else fills `reference`.
  const describe = (usage: (typeof usages)[number]) =>
    usage.reference || usage.filename || '-';
  // Absent means one, never zero: rows written before variable amounts existed
  // spent exactly one credit.
  const spent = (usage: (typeof usages)[number]) => usage.credits ?? 1;
  const showCredits = labels.columnCredits !== undefined;

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

      {!isLoading && usages.length === 0 && (
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

      {!isLoading && usages.length > 0 && (
        <>
          {isWide ? (
            /* Wide-window table */
            <View>
              <View className='flex-row border-b border-border'>
                <Text className={cx(HEADER_CELL_CLASS, 'text-left')}>
                  {labels.columnDate}
                </Text>
                <Text className={cx(HEADER_CELL_CLASS, 'text-left')}>
                  {labels.columnFilename}
                </Text>
                {showCredits && (
                  <Text className={cx(HEADER_CELL_CLASS, 'text-right')}>
                    {labels.columnCredits}
                  </Text>
                )}
              </View>
              {usages.map(usage => (
                <View
                  key={usage.id}
                  className='flex-row border-b border-border/50'
                >
                  <Text className={cx(CELL_CLASS, 'text-foreground')}>
                    {formatters.formatDate(usage.created_at)}
                  </Text>
                  <Text className={cx(CELL_CLASS, 'text-muted-foreground')}>
                    {describe(usage)}
                  </Text>
                  {showCredits && (
                    <Text
                      className={cx(
                        CELL_CLASS,
                        'text-right tabular-nums text-foreground'
                      )}
                    >
                      {spent(usage)}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            /* Narrow-window cards */
            <View className='gap-3'>
              {usages.map(usage => (
                <View
                  key={usage.id}
                  className='rounded-lg border border-border bg-card p-4'
                >
                  <Text className={cx(size.sm, 'text-muted-foreground')}>
                    {formatters.formatDate(usage.created_at)}
                  </Text>
                  <Text
                    className={cx(size.sm, weight.medium, 'text-foreground')}
                  >
                    {describe(usage)}
                  </Text>
                  {showCredits && (
                    <Text className={cx(size.sm, 'text-muted-foreground')}>
                      {labels.columnCredits}: {spent(usage)}
                    </Text>
                  )}
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
