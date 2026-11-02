/**
 * @fileoverview Credit store page displaying the user's balance and a stacked
 * list of purchasable credit packages. Purely presentational -- all data and
 * callbacks are passed via props.
 */

import { View, Text, TouchableOpacity } from 'react-native';
import { designTokens } from '@sudobility/design';
import { LoadingSpinner } from './LoadingSpinner';
import {
  primaryButtonClass,
  primaryButtonFullWidthClass,
  primaryButtonTextClass,
} from './controls';
import type { CreditStorePageProps } from './types';

const { size, weight } = designTokens.typography;

/**
 * Renders a credit store with balance display, purchase packages,
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
  return (
    <View className={className}>
      {/*
        Omitted when the title is empty, so a host that has already given the
        store a heading of its own -- CreditPaywallDialog, whose heading says
        why it opened -- does not print a second one.
      */}
      {labels.title !== '' && (
        <Text
          className={[size['2xl'], weight.bold, 'mb-6 text-foreground'].join(
            ' '
          )}
        >
          {labels.title}
        </Text>
      )}

      {/* Balance display */}
      {isAuthenticated && balance !== null && (
        <View className='mb-8 rounded-lg border border-primary/20 bg-primary/10 p-4'>
          <Text className={[size.sm, weight.medium, 'text-primary'].join(' ')}>
            {labels.currentBalanceLabel}
          </Text>
          <Text
            className={[size['3xl'], weight.bold, 'text-foreground'].join(' ')}
          >
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
          <Text
            className={[size.sm, weight.medium, 'text-foreground'].join(' ')}
          >
            {labels.errorTitle}
          </Text>
          <Text className={[size.sm, 'text-destructive'].join(' ')}>
            {error}
          </Text>
        </View>
      )}

      {/* Login prompt */}
      {!isAuthenticated && (
        <View className='mb-6 rounded-lg border border-border bg-muted p-4'>
          <Text className={[size.sm, 'text-foreground'].join(' ')}>
            {labels.loginRequired}
          </Text>
          <TouchableOpacity
            onPress={onLoginClick}
            className={['mt-2 self-start', primaryButtonClass()].join(' ')}
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
          className={[size.sm, 'py-8 text-center text-muted-foreground'].join(
            ' '
          )}
        >
          {labels.noProducts}
        </Text>
      )}

      {/* Credit packages */}
      {!isLoading && packages.length > 0 && (
        <View className='gap-4'>
          {packages.map(pkg => (
            <View
              key={pkg.packageId}
              className='rounded-xl border border-border bg-card p-6'
            >
              <View className='items-center'>
                <Text
                  className={[size['3xl'], weight.bold, 'text-foreground'].join(
                    ' '
                  )}
                >
                  {formatters.formatCredits(pkg.credits)}
                </Text>
                {pkg.description && (
                  <Text
                    className={[size.sm, 'mt-1 text-muted-foreground'].join(
                      ' '
                    )}
                  >
                    {pkg.description}
                  </Text>
                )}
                {formatters.getPackageDescription && (
                  <Text
                    className={[size.sm, 'mt-1 text-muted-foreground'].join(
                      ' '
                    )}
                  >
                    {formatters.getPackageDescription(pkg.packageId)}
                  </Text>
                )}
                <Text
                  className={[
                    size.xl,
                    weight.semibold,
                    'mt-3 text-primary',
                  ].join(' ')}
                >
                  {pkg.priceString}
                </Text>
                <TouchableOpacity
                  onPress={() => onPurchase(pkg.packageId)}
                  disabled={isPurchasing || !isAuthenticated}
                  accessibilityRole='button'
                  className={[
                    'mt-4',
                    primaryButtonFullWidthClass(),
                    isPurchasing || !isAuthenticated ? 'opacity-50' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <Text className={primaryButtonTextClass()}>
                    {isPurchasing
                      ? labels.purchasingButton
                      : labels.purchaseButton}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
