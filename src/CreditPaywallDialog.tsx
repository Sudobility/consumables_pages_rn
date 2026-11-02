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
import type { CreditPaywallDialogProps } from './types';

const { size, weight } = designTokens.typography;

/**
 * Renders a centred modal containing the credit store, with the heading
 * saying why it appeared. Dismisses on the backdrop, the close control, and
 * the hardware back button (`onRequestClose`).
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
      {/* Backdrop: a press on it dismisses. */}
      <Pressable
        className='flex-1 items-center justify-center bg-black/50 p-4'
        onPress={onClose}
        accessibilityLabel={labels.closeLabel}
      >
        {/* Panel: swallows presses so a tap inside does not dismiss. */}
        <Pressable
          onPress={() => {}}
          accessibilityViewIsModal
          className={[
            'max-h-[85%] w-full max-w-2xl rounded-xl border border-border bg-card',
            className ?? '',
          ].join(' ')}
        >
          <View className='flex-row items-start justify-between gap-4 p-6 pb-0'>
            <View className='flex-1'>
              <Text
                className={[size['2xl'], weight.bold, 'text-foreground'].join(
                  ' '
                )}
              >
                {labels.paywallTitle}
              </Text>
              {labels.paywallMessage && (
                <Text
                  className={[size.sm, 'mt-2 text-muted-foreground'].join(' ')}
                >
                  {labels.paywallMessage}
                </Text>
              )}
            </View>

            <Pressable
              onPress={onClose}
              accessibilityRole='button'
              accessibilityLabel={labels.closeLabel}
              className='px-2 py-1'
            >
              <Text className={[size.xl, 'text-muted-foreground'].join(' ')}>
                ×
              </Text>
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}
