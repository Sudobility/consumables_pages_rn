/**
 * The classes this package's controls wear, read from the design system.
 *
 * The React Native mirror of @sudobility/consumables_pages' controls.ts. On the
 * web a `<button>` with background + text classes styles both itself and its
 * label; in React Native a `Pressable`/`TouchableOpacity` cannot colour the
 * `Text` inside it, so each control is a pair — the container classes and the
 * label classes — and the component puts each on the right element.
 *
 * The strings are what the web's `variants.*` resolve to once a host has
 * configured its theme (`bg-primary` under a `text-sm font-medium` label, a
 * `border-input bg-muted` field, …), less what only a browser understands:
 * hover, focus rings, transitions.
 *
 * Nothing here names a colour. Only semantic theme tokens (`bg-primary`,
 * `text-primary-foreground`, …) and `@sudobility/design` sizes and weights are
 * used, so the host's theme reaches every control. `design-system.test.ts`
 * holds the package to that.
 */
import { designTokens } from '@sudobility/design';

const { size, weight } = designTokens.typography;

/** Joins class names, dropping the ones a condition left out. */
export const cx = (
  ...parts: Array<string | false | null | undefined>
): string => parts.filter(Boolean).join(' ');

/** The one action a form or a card exists for. */
export const primaryButtonClass = (): string =>
  'items-center justify-center rounded-md bg-primary px-4 py-2';

/** Label classes for a primary action. */
export const primaryButtonTextClass = (): string =>
  [size.sm, weight.medium, 'text-primary-foreground'].join(' ');

/** A primary action that fills the width of what holds it. */
export const primaryButtonFullWidthClass = (): string =>
  'items-center justify-center rounded-md bg-primary px-4 py-2 self-stretch';

/** An action that is not the point of the page: load more, go back. */
export const quietButtonClass = (): string =>
  'items-center justify-center rounded-md px-4 py-2';

/** Label classes for a quiet action. */
export const quietButtonTextClass = (): string =>
  [size.sm, weight.medium, 'text-muted-foreground'].join(' ');

/**
 * A text field. It carries no font-size class: React Native's default is
 * already the web field's 14, and the class would add a line height, which
 * pushes the text of a single-line field off centre on iOS.
 */
export const inputClass = (): string =>
  'rounded-lg border border-input bg-muted px-3 text-foreground';

/** What a control wears while it cannot be pressed (the web's `disabled:`). */
export const DISABLED_CLASS = 'opacity-50';

/**
 * One height for a field and the button beside it. Each sizes itself from its
 * own padding and font otherwise, and a row of the two comes out ragged.
 */
export const FIELD_HEIGHT_CLASS = 'h-11';
