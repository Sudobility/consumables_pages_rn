# CLAUDE.md

Context for AI assistants working on `@sudobility/consumables_pages_rn`.

## What this is

The React Native mirror of `@sudobility/consumables_pages` (web). It ships the
same set of credit components, adapted from HTML/Tailwind to React Native
primitives (`View`, `Text`, `TouchableOpacity`, `Pressable`, `TextInput`,
`Modal`, `ScrollView`, `ActivityIndicator`) with NativeWind `className`, plus
`react-native-svg` for the one icon the web draws (the badge's coin).

The source is file-for-file parallel to the web package's `src/`. Three files
have no web twin, and none is exported: `breakpoints.ts` (the web's `sm:`/`lg:`
variants, read from the window width), `svg-interop.ts` (lets an `<Svg>` take
its colour from a class) and `nativewind.d.ts` (types `className`).

## How an app consumes it (read this before touching packaging)

Metro reads the package from **`src/`**, not `dist/`: `package.json` has
`"react-native": "src/index.ts"` at the top level **and** a
`"react-native": "./src/index.ts"` condition inside `exports`, ahead of `import`
(Metro honours `exports` first). That is what makes `className` work: NativeWind
styles JSX only when the **app's** Babel compiles it. Precompiled `dist/` calls
`react/jsx-runtime` directly, so every `className` on a `View`/`Text`/… is
silently ignored and a page renders as unstyled lines of text. `dist/` is for
types and non-Metro tooling only. `src` must therefore stay in what is published
(there is no `files` list, so everything is; if one is ever added it must name
`src`). `src/__tests__/packaging.test.ts` holds all of this.

The app must also list
`./node_modules/@sudobility/consumables_pages_rn/{src,dist}/**/*.{js,jsx,ts,tsx}`
in its `tailwind.config.js` `content`, or the classes only this package uses are
never generated.

Peers the host installs: `react`, `react-native`, `nativewind` (>=4),
`react-native-svg` (>=13), `@sudobility/consumables_client`,
`@sudobility/design`, `@sudobility/types`; `react-native-purchases` (>=7) is
optional, needed only by `RevenueCatCreditStore` and the RN adapter.

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

The token to use is the one the web resolves to once its host has called
`configureTheme()` — that is what `colors.component.*` / `variants.*` return
there:

| Web (`@sudobility/design`)     | Here                                            |
| ------------------------------ | ----------------------------------------------- |
| `alert.info` (balance, price, spinner) | `bg-info/10 border-info/30 text-info`   |
| `alert.error`                  | `bg-destructive/10 border-destructive/30 text-destructive` |
| `alert.warning` (login prompt) | `bg-warning/10 border-warning/30 text-warning`  |
| `card.default`                 | `bg-card border-border`                         |
| `badge.primary` / `badge.error`| `bg-primary/10 text-primary` / `bg-destructive/10 text-destructive` |
| `ui.text.muted`, `ui.border.default`, `ui.border.subtle` | `text-muted-foreground`, `border-border`, `border-border/50` |
| `variants.button.*`, `variants.input.default()` | `src/controls.ts` (container + label pairs) |

A web element with no size class is 16px; React Native's default is 14, so give
such text `size.base`.

## Keep it a mirror

When `consumables_pages` (web) gains, drops, or renames an export, mirror it
here (and vice versa for shared prop/label/formatter shapes in `types.ts`). The
two packages are expected to stay in lockstep on their public surface — the
only names that differ are the adapter's five functions (`…Web…` there,
`…RN…` here). Change a web component and its twin here together: same sections
in the same order, same headings and wording, same loading / empty / error
states, same client calls with the same arguments.

What is deliberately native rather than copied:

- **Breakpoints.** The web's `sm:` (640) and `lg:` (1024) variants are read
  from the window width by `useBreakpoints()`. From `sm` the history pages are a
  table with column headers and below it cards; the store grid is one, two
  (`sm`) or three (`lg`) packages to a row; the coupon forms put fields side by
  side from `sm`. Do not drop the table: it is the only place the `column*`
  labels are shown.
- **Form validation.** The web coupon form leaves `required` / `type` / `min` /
  `step` to the browser, which refuses to submit an invalid form. Here the same
  rules are code in `CreditCouponPages.tsx`, and "Create 8-character coupon" is
  disabled until they hold: credits a whole number ≥ 1, an expiry that is a
  real `YYYY-MM-DD HH:MM` (read as local time, like `datetime-local`), an
  email that is empty or valid. The expiry is parsed by hand, never by
  `new Date(text)`.
- **The dialog.** `CreditPaywallDialog` is an RN `Modal`; the backdrop is a
  sibling *under* the panel (so a press inside the panel cannot dismiss, and
  the panel's contents stay reachable by a screen reader), the hardware back
  button and the screen reader's escape gesture stand in for Escape.
- **Scrolling.** `ManageCreditCouponsPage` owns a `ScrollView` and takes
  `contentContainerStyle` (RN only) for the host's safe-area scroll insets. The
  other components are fragments the host places in its own scroll view.

## The RevenueCat adapter

`src/adapters/revenuecat-rn.ts` follows the web's `revenuecat-web.ts` rule for
rule, and `src/__tests__/revenuecat-rn.test.ts` holds it there:

- no key → `getOfferings` and `purchase` throw `RevenueCat not configured`,
  `setConsumablesRNUser` is a no-op;
- the catalog can be read before anybody signs in; **a purchase cannot** —
  `RevenueCat user not set`. An API that verifies a purchase
  (`consumables_service`'s `findCustomerPurchase`) looks the transaction up
  under the buyer's own id, so an anonymous purchase is paid for and never
  credited;
- RN only: the web sets a user by configuring its SDK, which cannot fail; here
  it is `Purchases.logIn`, a network call. The user the host asked for is
  remembered, and `purchase` tries that login once more before refusing — so
  being offline at sign-in does not disable purchases until the app restarts.
  After a failed switch of user nobody counts as logged in;
- `react-native-purchases` is loaded lazily with `require` inside a `try`, so it
  stays an optional peer. Its API is the **default export**
  (`require('react-native-purchases').default`); the module namespace has only
  enums and error classes. Calling `configure` on the namespace is a
  `TypeError`, and was this adapter's bug until it was tested;
- `source` is `apple` on iOS and macOS, `google` otherwise.

## Build & test

- `bun run typecheck` / `bun run build` — `tsc` (Metro reads `src` via the
  `react-native` export condition; `dist` is for other tooling).
- `bun run lint` (zero warnings) / `bun run format:check` — ESLint and Prettier
  over `src`; `bun run format` fixes formatting.
- `bun run test:unit` — Vitest. `react-native` and `react-native-svg` are
  aliased to lightweight DOM mocks (`src/__tests__/mocks/`), `nativewind` is
  mocked in `src/__tests__/setup.ts`; tests use the helpers in
  `src/__tests__/test-utils.tsx`, not `@testing-library/react-native`. The mock
  turns a press into a click, an accessibility role/label into `role` /
  `aria-label`, and a disabled touchable into one that does not fire. A test
  that needs a wide window calls `__setWindowWidth(640)` (imported from
  `react-native`); it is reset after every test.
- `src/__tests__` is excluded from `tsconfig*.json` (it imports `vitest`), so it
  is neither typechecked by `tsc` nor emitted to `dist`.
- No `test` script exists — use `bun run test:unit`. `bun run build` runs `tsc`
  then `scripts/fix-esm-imports.mjs`, which appends `.js` to relative imports so
  the emitted ESM resolves (`"type": "module"`). Don't hand-edit `dist`.
- `@sudobility/*` deps resolve from **GitHub Packages**, not public npm (see
  `.npmrc` / `publishConfig`); CI publishes there. `react-native-purchases` is an
  optional peer, needed only by `RevenueCatCreditStore` and the RN adapter; it
  is not installed here, so the adapter test intercepts the module loader.

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
