/**
 * @fileoverview Usage history page with a card layout and load-more
 * pagination. Purely presentational -- data and callbacks come via props.
 */

import { View, Text, TouchableOpacity } from 'react-native';
import { designTokens } from '@sudobility/design';
import { LoadingSpinner } from './LoadingSpinner';
import { quietButtonClass, quietButtonTextClass } from './controls';
import type { UsageHistoryPageProps } from './types';

const { size, weight } = designTokens.typography;

/**
 * Renders a paginated list of usage records as cards.
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

      {!isLoading && usages.length === 0 && (
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

      {!isLoading && usages.length > 0 && (
        <>
          <View className='gap-3'>
            {usages.map(usage => (
              <View
                key={usage.id}
                className='rounded-lg border border-border bg-card p-4'
              >
                <Text className={[size.sm, 'text-muted-foreground'].join(' ')}>
                  {formatters.formatDate(usage.created_at)}
                </Text>
                <Text
                  className={[size.sm, weight.medium, 'text-foreground'].join(
                    ' '
                  )}
                >
                  {describe(usage)}
                </Text>
                {showCredits && (
                  <Text
                    className={[size.sm, 'text-muted-foreground'].join(' ')}
                  >
                    {labels.columnCredits}: {spent(usage)}
                  </Text>
                )}
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
