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
