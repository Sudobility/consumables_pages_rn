/**
 * @fileoverview Inline credit balance badge for topbar integration. Displays a
 * pill-shaped badge with a coin glyph and the current balance. Renders as a
 * pressable when onClick is provided, otherwise as a static view.
 */

import { View, Text, TouchableOpacity } from 'react-native';
import { designTokens } from '@sudobility/design';
import type { CreditBalanceBadgeProps } from './types';

const { size, weight } = designTokens.typography;

/**
 * Renders a small inline badge showing the user's credit balance.
 * Primary tint when balance > 0, destructive when balance is 0. Returns null
 * when balance is null.
 * @param props - See {@link CreditBalanceBadgeProps} for full prop documentation.
 */
export function CreditBalanceBadge({
  balance,
  isLoading,
  onClick,
  className,
}: CreditBalanceBadgeProps) {
  if (isLoading) {
    return (
      <View
        className={['flex-row items-center px-2.5 py-1', className || ''].join(
          ' '
        )}
        accessibilityLabel='Loading balance'
      >
        <Text className={[size.xs, 'text-muted-foreground'].join(' ')}>
          ...
        </Text>
      </View>
    );
  }

  if (balance === null) return null;

  const tint = balance > 0 ? 'text-primary' : 'text-destructive';
  const bg = balance > 0 ? 'bg-primary/10' : 'bg-destructive/10';
  const containerClass = [
    'flex-row items-center gap-1.5 rounded-full px-2.5 py-1',
    bg,
    className || '',
  ].join(' ');
  const textClass = [size.xs, weight.medium, tint].join(' ');

  const content = (
    <>
      <Text className={textClass}>◉</Text>
      <Text className={textClass}>{balance}</Text>
    </>
  );

  if (onClick) {
    return (
      <TouchableOpacity
        className={containerClass}
        onPress={onClick}
        accessibilityRole='button'
        accessibilityLabel={`Credit balance: ${balance}`}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View className={containerClass}>{content}</View>;
}
