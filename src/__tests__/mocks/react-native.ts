/**
 * Mock implementation of react-native for Vitest.
 * Used as an alias to avoid parsing Flow types in the actual RN package.
 */
import React from 'react';
import { vi } from 'vitest';

const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
  hairlineWidth: 1,
  flatten: (style: unknown) => style,
};

const createMockComponent = (name: string, tag = 'div') => {
  const Component = ({ onPress, children, ...rest }: Record<string, any>) => {
    const domProps: Record<string, any> = { ...rest, 'data-testid': name };
    if (onPress) domProps.onClick = onPress;
    return React.createElement(tag, domProps, children);
  };
  Component.displayName = name;
  return Component;
};

export const View = createMockComponent('View');
export const Text = createMockComponent('Text', 'span');
export const TextInput = createMockComponent('TextInput', 'input');
export const TouchableOpacity = createMockComponent('TouchableOpacity');
export const Pressable = createMockComponent('Pressable');
export const ScrollView = ({
  onPress,
  children,
  contentContainerClassName: _ccc,
  ...rest
}: Record<string, any>) => {
  const domProps: Record<string, any> = {
    ...rest,
    'data-testid': 'ScrollView',
  };
  if (onPress) domProps.onClick = onPress;
  return React.createElement('div', domProps, children);
};
export const ActivityIndicator = createMockComponent('ActivityIndicator');
export const Image = createMockComponent('Image', 'img');
export const SafeAreaView = createMockComponent('SafeAreaView');

/**
 * Modal mock: renders its children when `visible` is not explicitly false,
 * mirroring RN's visibility gate. RN-only props are stripped so jsdom does not
 * warn about unknown DOM attributes.
 */
export const Modal = ({
  visible,
  children,
  onRequestClose: _onRequestClose,
  transparent: _transparent,
  animationType: _animationType,
  ...rest
}: Record<string, any>) => {
  if (visible === false) return null;
  return React.createElement(
    'div',
    { ...rest, 'data-testid': 'Modal' },
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

export { StyleSheet };
