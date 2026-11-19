/**
 * Mock implementation of react-native for Vitest.
 * Used as an alias to avoid parsing Flow types in the actual RN package.
 *
 * Each component renders a DOM element, with the React Native props a test
 * can observe translated to their DOM counterparts (a press is a click, an
 * accessibility role is a `role`, a disabled touchable does not fire) and the
 * rest dropped, so React does not warn about attributes a DOM node lacks.
 */
import React from 'react';
import { vi } from 'vitest';

const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
  hairlineWidth: 1,
  flatten: (style: unknown) => style,
};

/** React Native accessibility roles a DOM role is spelled differently for. */
const ROLES: Record<string, string> = { header: 'heading' };

function toDomProps(
  name: string,
  {
    onPress,
    disabled,
    accessible: _accessible,
    accessibilityRole,
    accessibilityLabel,
    accessibilityState,
    accessibilityViewIsModal,
    accessibilityLiveRegion,
    accessibilityElementsHidden: _accessibilityElementsHidden,
    importantForAccessibility: _importantForAccessibility,
    onAccessibilityEscape,
    style: _style,
    ...rest
  }: Record<string, any>
): Record<string, any> {
  const domProps: Record<string, any> = { ...rest, 'data-testid': name };
  if (accessibilityRole) {
    domProps.role = ROLES[accessibilityRole] ?? accessibilityRole;
  }
  if (accessibilityLabel) domProps['aria-label'] = accessibilityLabel;
  if (accessibilityViewIsModal) domProps['aria-modal'] = 'true';
  if (accessibilityLiveRegion) domProps['aria-live'] = accessibilityLiveRegion;
  if (accessibilityState?.busy) domProps['aria-busy'] = 'true';
  if (disabled || accessibilityState?.disabled) {
    domProps['aria-disabled'] = 'true';
  }
  // Like the real ones: a disabled touchable does not fire.
  if (onPress && !disabled) domProps.onClick = onPress;
  // The screen reader's escape gesture, as the key a test can press. The
  // view that handles it is the last to hear of it, as on the device.
  if (onAccessibilityEscape) {
    domProps.onKeyDown = (event: {
      key: string;
      stopPropagation: () => void;
    }) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      onAccessibilityEscape();
    };
  }
  return domProps;
}

const createMockComponent = (name: string, tag = 'div') => {
  const Component = ({ children, ...rest }: Record<string, any>) =>
    React.createElement(tag, toDomProps(name, rest), children);
  Component.displayName = name;
  return Component;
};

export const View = createMockComponent('View');
export const Text = createMockComponent('Text', 'span');
export const TouchableOpacity = createMockComponent('TouchableOpacity');
export const Pressable = createMockComponent('Pressable');
export const ActivityIndicator = createMockComponent('ActivityIndicator');
export const Image = createMockComponent('Image', 'img');
export const SafeAreaView = createMockComponent('SafeAreaView');

/** A controlled `<input>`: `onChangeText` is the DOM's `onChange`. */
export const TextInput = ({
  value,
  onChangeText,
  editable,
  keyboardType: _keyboardType,
  autoCapitalize: _autoCapitalize,
  autoCorrect: _autoCorrect,
  ...rest
}: Record<string, any>) =>
  React.createElement('input', {
    ...toDomProps('TextInput', rest),
    value: value ?? '',
    readOnly: editable === false,
    onChange: (event: { target: { value: string } }) =>
      onChangeText?.(event.target.value),
  });

export const ScrollView = ({
  children,
  // Scroller-only props: nothing a DOM node understands.
  contentContainerClassName: _contentContainerClassName,
  contentContainerStyle: _contentContainerStyle,
  keyboardShouldPersistTaps: _keyboardShouldPersistTaps,
  ...rest
}: Record<string, any>) =>
  React.createElement('div', toDomProps('ScrollView', rest), children);

/**
 * Modal mock: renders its children when `visible` is not explicitly false,
 * mirroring RN's visibility gate. `onRequestClose` -- the hardware back
 * button -- answers the Escape key, which is the web dialog's way out.
 */
export const Modal = ({
  visible,
  children,
  onRequestClose,
  transparent: _transparent,
  animationType: _animationType,
  ...rest
}: Record<string, any>) => {
  if (visible === false) return null;
  return React.createElement(
    'div',
    {
      ...toDomProps('Modal', rest),
      onKeyDown: (event: { key: string }) => {
        if (event.key === 'Escape') onRequestClose?.();
      },
    },
    children
  );
};

export const Alert = {
  alert: vi.fn(),
};

export const Platform = {
  OS: 'ios' as string,
  select: (obj: Record<string, unknown>) => obj.ios ?? obj.default,
};

export const useColorScheme = vi.fn(() => 'light');

/** A phone in portrait unless a test says otherwise. */
const PHONE_WIDTH = 390;
let windowWidth = PHONE_WIDTH;

/** Test-only: the window width `useWindowDimensions` reports from now on. */
export function __setWindowWidth(width: number = PHONE_WIDTH): void {
  windowWidth = width;
}

export const useWindowDimensions = () => ({
  width: windowWidth,
  height: 844,
  scale: 3,
  fontScale: 1,
});

export { StyleSheet };
