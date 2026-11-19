/**
 * @fileoverview Shared internal loading spinner used across all page
 * components. Extracted to reduce duplication and centralize the spinner and
 * its accessibility attributes.
 * Internal component -- not exported from the package barrel.
 */

import { View, ActivityIndicator } from 'react-native';

/**
 * Renders a centered spinning loading indicator, announced as busy.
 *
 * Drawn in the theme's `info` colour, as the web's is: NativeWind maps the
 * text-colour class onto the indicator's `color`.
 */
export function LoadingSpinner() {
  return (
    <View
      className='items-center justify-center py-12'
      accessible
      accessibilityRole='progressbar'
      accessibilityLabel='Loading'
      accessibilityState={{ busy: true }}
    >
      <ActivityIndicator className='text-info' />
    </View>
  );
}
