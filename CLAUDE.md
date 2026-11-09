# CLAUDE.md

Context for AI assistants working on `@sudobility/consumables_pages_rn`.

## What this is

The React Native mirror of `@sudobility/consumables_pages` (web). It ships the
same set of credit components, adapted from HTML/Tailwind to React Native
primitives (`View`, `Text`, `TouchableOpacity`, `TextInput`, `Modal`,
`ActivityIndicator`) with NativeWind `className`.

## Hard rule: UI only

Business logic belongs in `@sudobility/consumables_client` (balance, products,
purchases, coupons, history — exposed as hooks and `ConsumablesApiClient`).
Components here are either:

- **presentational** — take data + callbacks + `labels` + `formatters` via
  props, hold no data logic (`CreditStorePage`, `CreditPaywallDialog`,
  `PurchaseHistoryPage`, `UsageHistoryPage`, `CreditBalanceBadge`); or
- **connected** — thin containers that call `consumables_client` hooks and
  render the presentational pieces (`RevenueCatCreditStore`,
  `CreditHistoryPage`, the coupon pages).

Do not add fetching, purchase, or persistence logic to this package; add it to
`consumables_client`.

## Colour comes from the design system

Use only semantic theme classes (`bg-primary`, `text-foreground`,
`text-muted-foreground`, `border-border`, `text-destructive`, `text-success`,
…) and `designTokens.typography` from `@sudobility/design`. Never hard-code a
palette colour (`bg-blue-500`, `text-white`) or a host-specific `theme-*` class
— `src/__tests__/design-system.test.ts` enforces this, the same way the web
package does. `@sudobility/design` is a peer dependency, never a dependency, so
the host themes a single shared copy.

## Keep it a mirror

When `consumables_pages` (web) gains, drops, or renames an export, mirror it
here (and vice versa for shared prop/label/formatter shapes in `types.ts`). The
two packages are expected to stay in lockstep on their public surface.

## Build & test

- `bun run typecheck` / `bun run build` — `tsc` (Metro reads `src` via the
  `react-native` export condition; `dist` is for other tooling).
- `bun run test:unit` — Vitest. RN is aliased to a lightweight DOM mock
  (`src/__tests__/mocks/react-native.ts`); tests use the helpers in
  `src/__tests__/test-utils.tsx`, not `@testing-library/react-native`.
- `src/__tests__` is excluded from `tsconfig*.json` (it imports `vitest`), so it
  is neither typechecked by `tsc` nor emitted to `dist`.
- No `test` script exists — use `bun run test:unit`. `bun run build` runs `tsc`
  then `scripts/fix-esm-imports.mjs`, which appends `.js` to relative imports so
  the emitted ESM resolves (`"type": "module"`). Don't hand-edit `dist`.
- `@sudobility/*` deps resolve from **GitHub Packages**, not public npm (see
  `.npmrc` / `publishConfig`); CI publishes there. `react-native-purchases` is an
  optional peer, needed only by `RevenueCatCreditStore` and the RN adapter.

## Screen rendering — safe area & scroll insets

Honour the device safe area on **every** screen. Always use `useSafeAreaInsets()`
from `react-native-safe-area-context` (or a `SafeAreaView` with explicit `edges`)
and pad by the actual inset value. **Never hard-code a padding/margin in place of
an inset** — a magic number like `paddingBottom: 80` happens to clear today's
phone and is wrong on the next one.

Decide per axis, by whether that axis scrolls:

**Vertical:**
- **NOT vertically scrollable** (a fixed screen, a pinned footer/CTA, a camera
  overlay): the content area must stop at the **top and bottom** safe-area insets
  — pad top by `insets.top`, bottom by `insets.bottom`. It must not reach the
  physical top/bottom edge (status bar / notch / home indicator).
- **Vertically scrollable**: let the scroll view render **full-bleed** to the top
  and bottom edges, and give it top/bottom **scroll insets** equal to the safe
  area (`contentInset` + `scrollIndicatorInsets`, or
  `contentInsetAdjustmentBehavior="automatic"`). Content then starts/ends clear of
  the unsafe regions while still scrolling edge-to-edge behind them.

**Horizontal** (landscape, display cutout, rounded corners):
- **NOT horizontally scrollable**: pad left/right by `insets.left` / `insets.right`.
- **Horizontally scrollable**: render to the left/right edges and give it
  left/right scroll insets.

**Bottom CTAs under a tab bar — the trap that burns everyone:** inside a tab
navigator, the bottom safe-area inset (`insets.bottom`, and what a shared
`BottomActionBar` reads) **already includes the tab-bar height**. So a pinned
bottom bar padded by `insets.bottom` already lands above the tab bar. Therefore:
- DO pad the bottom bar by `insets.bottom` and nothing more.
- DON'T add the tab-bar height on top of the inset, and DON'T reserve it again on
  the screen root — that double-counts and floats the CTA too high.
- DON'T pass a `tabBarHeight` (or similar) that makes the bar swap the inset for a
  flat fixed gap — that ignores the inset and drops the CTA under the tab bar.

Canonical fixed-screen shape: a flex-column root → the content/scroll region →
a bottom action bar as the **last child** that pads by `insets.bottom` with no
manual tab-bar math. Copy a screen already doing this correctly (e.g. a Settings
screen with a Sign-Out button) rather than re-deriving the padding.
