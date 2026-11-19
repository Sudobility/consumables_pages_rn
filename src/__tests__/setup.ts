/**
 * Vitest setup.
 *
 * `react-native` and `react-native-svg` are aliased to DOM mocks (see
 * vitest.config.ts), and the components take their data via props, so the only
 * global mock is NativeWind, whose real module needs a React Native runtime.
 * `@sudobility/design` is a real (dev) dependency and resolves normally.
 */
import { afterEach, vi } from 'vitest';
import { __setWindowWidth } from 'react-native';

// NativeWind is only asked to register the Svg interop.
vi.mock('nativewind', () => ({ cssInterop: vi.fn() }));

// Every test starts on a phone-width window; a test that widens it does not
// leak into the next.
afterEach(() => {
  __setWindowWidth();
});
