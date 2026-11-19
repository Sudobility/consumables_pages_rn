/**
 * Mock of react-native-svg for Vitest: an icon renders as an empty element
 * that keeps its class and its paths' data, which is all a test can observe
 * of one.
 */
import React from 'react';

const Svg = ({ className, children }: Record<string, any>) =>
  React.createElement('i', { 'data-testid': 'Svg', className }, children);

export const Path = ({ d }: Record<string, any>) =>
  React.createElement('b', { 'data-testid': 'Path', 'data-d': d });

export default Svg;
