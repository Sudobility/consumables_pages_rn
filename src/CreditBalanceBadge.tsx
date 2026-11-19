/**
 * @fileoverview Inline credit balance badge for topbar integration. Displays a
 * pill-shaped badge with a coin icon and the current balance. Renders as a
 * pressable when onClick is provided, otherwise as a static view.
 */

import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { designTokens } from '@sudobility/design';
import { cx } from './controls';
import './svg-interop';
import type { CreditBalanceBadgeProps } from './types';

const { size, weight } = designTokens.typography;

/** The web badge's coin, path for path, on its 20-unit grid. */
const COIN_PATH =
  'M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z';

/** The web's `w-3.5 h-3.5`, in points. */
const COIN_SIZE = 14;

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
        className={cx('flex-row items-center gap-1.5 px-2.5 py-1', className)}
        accessible
        accessibilityLabel='Loading balance'
        accessibilityState={{ busy: true }}
      >
        <Text className={cx(size.xs, weight.medium, 'text-muted-foreground')}>
          ...
        </Text>
      </View>
    );
  }

  if (balance === null) return null;

  const tint = balance > 0 ? 'text-primary' : 'text-destructive';
  const bg = balance > 0 ? 'bg-primary/10' : 'bg-destructive/10';
  const containerClass = cx(
    'flex-row items-center gap-1.5 rounded-full px-2.5 py-1',
    bg,
    className
  );

  const content = (
    <>
      <Svg
        width={COIN_SIZE}
        height={COIN_SIZE}
        viewBox='0 0 20 20'
        fill='currentColor'
        className={tint}
        accessibilityElementsHidden
        importantForAccessibility='no-hide-descendants'
      >
        <Path fillRule='evenodd' clipRule='evenodd' d={COIN_PATH} />
      </Svg>
      <Text className={cx(size.xs, weight.medium, tint)}>{balance}</Text>
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
