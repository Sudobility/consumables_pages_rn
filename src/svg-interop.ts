/**
 * Lets an `<Svg>` drawn by this package take its colour from a class.
 *
 * Registered once, as a side effect of importing this module: NativeWind then
 * maps the colour a `className` resolves to onto the `Svg`'s `color` prop, and
 * paths drawn with `fill='currentColor'` take it. So
 * `<Svg className='text-primary'>` follows the host's theme with no hook. Same
 * registration `@sudobility/components-rn` and `@sudobility/entity_pages_rn`
 * make; `cssInterop` keys it by component, so a second identical one simply
 * replaces the first.
 *
 * Internal -- not exported from the package barrel.
 */
import Svg from 'react-native-svg';
import { cssInterop } from 'nativewind';

if (typeof cssInterop === 'function') {
  cssInterop(Svg, {
    className: { target: 'style', nativeStyleToProp: { color: true } },
  });
}

export {};
