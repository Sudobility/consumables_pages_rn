/**
 * The web package's responsive breakpoints, for React Native.
 *
 * @sudobility/consumables_pages lays itself out with Tailwind's `sm:` and
 * `lg:` variants: a table from `sm` up and cards below it, a store grid of one,
 * two (`sm`) or three (`lg`) columns. Those are media queries on the viewport.
 * Here the same thresholds are read from the window, so a tablet or a desktop
 * window gets the layout the web gives a window that wide, and a phone gets
 * the web's phone layout.
 *
 * Internal -- not exported from the package barrel.
 */
import { useWindowDimensions } from 'react-native';

/** Tailwind's default `sm` min-width, in points. */
export const SM_MIN_WIDTH = 640;

/** Tailwind's default `lg` min-width, in points. */
export const LG_MIN_WIDTH = 1024;

export interface Breakpoints {
  /** The window is at least `sm` wide. */
  sm: boolean;
  /** The window is at least `lg` wide. */
  lg: boolean;
}

/** Which of the web's breakpoints the window currently reaches. */
export function useBreakpoints(): Breakpoints {
  const { width } = useWindowDimensions();
  return { sm: width >= SM_MIN_WIDTH, lg: width >= LG_MIN_WIDTH };
}
