/**
 * The classes this package's controls wear, read from the design system.
 *
 * The React Native mirror of @sudobility/consumables_pages' controls.ts. On the
 * web a `<button>` with background + text classes styles both itself and its
 * label; in React Native a `Pressable`/`TouchableOpacity` cannot colour the
 * `Text` inside it, so each control is a pair — the container classes and the
 * label classes — and the component puts each on the right element.
 *
 * Nothing here names a colour. Only semantic theme tokens (`bg-primary`,
 * `text-primary-foreground`, …) and `@sudobility/design` weights are used, so
 * the host's theme reaches every control. `design-system.test.ts` holds the
 * package to that.
 */
import { designTokens } from '@sudobility/design';

const { weight } = designTokens.typography;

/** The one action a form or a card exists for. */
export const primaryButtonClass = (): string =>
  'items-center justify-center rounded-md bg-primary px-4 py-2';

/** Label classes for a primary action. */
export const primaryButtonTextClass = (): string =>
  ['text-primary-foreground', weight.semibold].join(' ');

/** A primary action that fills the width of what holds it. */
export const primaryButtonFullWidthClass = (): string =>
  'items-center justify-center rounded-md bg-primary px-4 py-2 self-stretch';

/** An action that is not the point of the page: load more, go back. */
export const quietButtonClass = (): string =>
  'items-center justify-center rounded-md px-4 py-2';

/** Label classes for a quiet action. */
export const quietButtonTextClass = (): string =>
  ['text-muted-foreground', weight.semibold].join(' ');

/** A text field. */
export const inputClass = (): string =>
  'rounded-md border border-input bg-background px-3 text-foreground';

/**
 * One height for a field and the button beside it. Each sizes itself from its
 * own padding and font otherwise, and a row of the two comes out ragged.
 */
export const FIELD_HEIGHT_CLASS = 'h-11';
