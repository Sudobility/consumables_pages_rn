/**
 * @fileoverview Credit store page component displaying the user's balance and
 * a responsive grid of purchasable credit packages. Purely presentational --
 * all data and callbacks are passed via props.
 */

import { View, Text, TouchableOpacity } from 'react-native';
import { designTokens } from '@sudobility/design';
import { LoadingSpinner } from './LoadingSpinner';
import { useBreakpoints } from './breakpoints';
import {
  DISABLED_CLASS,
  cx,
  primaryButtonClass,
  primaryButtonFullWidthClass,
  primaryButtonTextClass,
} from './controls';
import type { CreditStorePageProps } from './types';

const { size, weight } = designTokens.typography;

/**
 * Renders a credit store with balance display, purchase packages grid,
 * loading/error states, and a login prompt for unauthenticated users.
 * @param props - See {@link CreditStorePageProps} for full prop documentation.
 */
export function CreditStorePage({
  isAuthenticated,
  balance,
  packages,
  isLoading,
  isPurchasing,
  error,
  onPurchase,
  onLoginClick,
  labels,
  formatters,
  className,
}: CreditStorePageProps) {
  // The web's `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
  const { sm, lg } = useBreakpoints();
  const columnClass = lg ? 'w-1/3' : sm ? 'w-1/2' : 'w-full';
  const purchaseDisabled = isPurchasing || !isAuthenticated;

  return (
    <View className={className}>
      {/*
        Omitted when the title is empty, so a host that has already given the
        store a heading of its own -- CreditPaywallDialog, whose heading says
        why it opened -- does not print a second one.
      */}
      {labels.title !== '' && (
        <Text
          className={cx(size['2xl'], weight.bold, 'mb-6 text-foreground')}
          accessibilityRole='header'
        >
          {labels.title}
        </Text>
      )}

      {/* Balance display */}
      {isAuthenticated && balance !== null && (
        <View className='mb-8 rounded-lg border border-info/30 bg-info/10 p-4'>
          <Text className={cx(size.sm, weight.medium, 'text-info')}>
            {labels.currentBalanceLabel}
          </Text>
          <Text className={cx(size['3xl'], weight.bold, 'text-info')}>
            {formatters.formatCredits(balance)}
          </Text>
        </View>
      )}

      {/* Error */}
      {error && (
        <View
          className='mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4'
          accessibilityRole='alert'
        >
          <Text className={cx(size.sm, weight.medium, 'text-destructive')}>
            {labels.errorTitle}
          </Text>
          <Text className={cx(size.sm, 'text-destructive')}>{error}</Text>
        </View>
      )}

      {/* Login prompt */}
      {!isAuthenticated && (
        <View className='mb-6 rounded-lg border border-warning/30 bg-warning/10 p-4'>
          <Text className={cx(size.sm, 'text-warning')}>
            {labels.loginRequired}
          </Text>
          <TouchableOpacity
            onPress={onLoginClick}
            className={cx('mt-2 self-start', primaryButtonClass())}
            accessibilityRole='button'
          >
            <Text className={primaryButtonTextClass()}>
              {labels.loginButton ?? 'Log in'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading */}
      {isLoading && <LoadingSpinner />}

      {/* No products */}
      {!isLoading && packages.length === 0 && (
        <Text
          className={cx(size.base, 'py-8 text-center text-muted-foreground')}
        >
          {labels.noProducts}
        </Text>
      )}

      {/*
        Credit packages grid. React Native has no CSS grid, so each package
        takes a fraction of a wrapping row, and the 16-point gap is half a gap
        of padding around every cell, taken back at the grid's edges.
      */}
      {!isLoading && packages.length > 0 && (
        <View className='-m-2 flex-row flex-wrap'>
          {packages.map(pkg => (
            <View key={pkg.packageId} className={cx('p-2', columnClass)}>
              <View className='rounded-xl border border-border bg-card p-6 shadow-sm'>
                <View className='items-center'>
                  <Text
                    className={cx(size['3xl'], weight.bold, 'text-foreground')}
                  >
                    {formatters.formatCredits(pkg.credits)}
                  </Text>
                  {pkg.description && (
                    <Text className={cx(size.sm, 'mt-1 text-muted-foreground')}>
                      {pkg.description}
                    </Text>
                  )}
                  {formatters.getPackageDescription && (
                    <Text className={cx(size.sm, 'mt-1 text-muted-foreground')}>
                      {formatters.getPackageDescription(pkg.packageId)}
                    </Text>
                  )}
                  <Text
                    className={cx(size.xl, weight.semibold, 'mt-3 text-info')}
                  >
                    {pkg.priceString}
                  </Text>
                  <TouchableOpacity
                    onPress={() => onPurchase(pkg.packageId)}
                    disabled={purchaseDisabled}
                    accessibilityRole='button'
                    accessibilityState={{ disabled: purchaseDisabled }}
                    className={cx(
                      'mt-4',
                      primaryButtonFullWidthClass(),
                      purchaseDisabled && DISABLED_CLASS
                    )}
                  >
                    <Text className={primaryButtonTextClass()}>
                      {isPurchasing
                        ? labels.purchasingButton
                        : labels.purchaseButton}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
