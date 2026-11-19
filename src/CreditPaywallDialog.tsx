/**
 * @fileoverview Modal shown when an action is refused for want of credits.
 * Wraps CreditStorePage in a dialog so a product can sell credits at the
 * moment of refusal rather than sending the user away to a store page and
 * losing whatever they were doing. Purely presentational -- all data,
 * callbacks and copy are passed via props.
 */

import { Modal, View, Text, ScrollView, Pressable } from 'react-native';
import { designTokens } from '@sudobility/design';
import { CreditStorePage } from './CreditStorePage';
import { cx } from './controls';
import type { CreditPaywallDialogProps } from './types';

const { size, weight } = designTokens.typography;

/**
 * Renders a centred modal containing the credit store, with the heading
 * saying why it appeared.
 *
 * The shell is a React Native `Modal` over a hand-rolled panel, matching the
 * rest of this package: it depends on `@sudobility/design` alone. It owns the
 * behaviours the web dialog has, in their native form -- the hardware back
 * button and the screen reader's escape gesture dismiss (the web's Escape), a
 * press on the backdrop dismisses, and the panel is modal to assistive
 * technology.
 *
 * @param props - See {@link CreditPaywallDialogProps} for full prop documentation.
 */
export function CreditPaywallDialog({
  isOpen,
  onClose,
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
}: CreditPaywallDialogProps) {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType='fade'
      onRequestClose={onClose}
    >
      <View className='flex-1 items-center justify-center p-4'>
        {/*
          The backdrop dismisses, and only the backdrop: it lies under the
          panel as a sibling rather than around it, so a press that lands
          inside the panel never reaches it. Hidden from assistive technology,
          as the web's is -- the close control is the labelled way out.
        */}
        <Pressable
          className='absolute inset-0 bg-black/50'
          onPress={onClose}
          accessible={false}
          importantForAccessibility='no'
        />

        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          className={cx(
            'max-h-[85%] w-full max-w-2xl rounded-xl border border-border bg-card shadow-lg',
            className
          )}
        >
          <View className='flex-row items-start justify-between gap-4 p-6 pb-0'>
            <View className='flex-1'>
              <Text
                className={cx(size['2xl'], weight.bold, 'text-foreground')}
                accessibilityRole='header'
              >
                {labels.paywallTitle}
              </Text>
              {labels.paywallMessage && (
                <Text className={cx(size.sm, 'mt-2 text-muted-foreground')}>
                  {labels.paywallMessage}
                </Text>
              )}
            </View>

            <Pressable
              onPress={onClose}
              accessibilityRole='button'
              accessibilityLabel={labels.closeLabel}
              className='rounded-lg px-2 py-1'
            >
              <Text className={cx(size.xl, 'text-muted-foreground')}>×</Text>
            </Pressable>
          </View>

          {/*
            The store, with its own heading suppressed: the dialog's heading
            already says what this is, and two would read as two sections.
          */}
          <ScrollView className='p-6' contentContainerClassName='pb-2'>
            <CreditStorePage
              isAuthenticated={isAuthenticated}
              balance={balance}
              packages={packages}
              isLoading={isLoading}
              isPurchasing={isPurchasing}
              error={error}
              onPurchase={onPurchase}
              onLoginClick={onLoginClick}
              labels={{ ...labels, title: '' }}
              formatters={formatters}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
