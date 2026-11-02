/**
 * @fileoverview Shared internal loading spinner used across all page
 * components. Extracted to reduce duplication and centralize the spinner.
 * Internal component -- not exported from the package barrel.
 */

import { View, ActivityIndicator } from 'react-native';

/** Renders a centered spinning loading indicator. */
export function LoadingSpinner() {
  return (
    <View className='items-center justify-center py-12'>
      <ActivityIndicator accessibilityLabel='Loading' />
    </View>
  );
}
