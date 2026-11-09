# @sudobility/consumables_pages_rn

React Native UI components for consumable credits — the RN mirror of
[`@sudobility/consumables_pages`](https://github.com/Sudobility/consumables_pages).

These are **UI components only**. All business logic (balance tracking, product
loading, purchases, coupon redemption, history) lives in
[`@sudobility/consumables_client`](https://github.com/Sudobility/consumables_client);
the components here take data and callbacks via props, or — for the "connected"
variants — call the client's hooks and render the presentational pieces.

## Components

| Component                | Kind          | Notes                                                        |
| ------------------------ | ------------- | ------------------------------------------------------------ |
| `CreditStorePage`        | presentational | Balance + purchasable packages. Data via props.             |
| `RevenueCatCreditStore`  | connected     | Loads products/balance via `consumables_client`, renders `CreditStorePage`. |
| `CreditPaywallDialog`    | presentational | `CreditStorePage` in a modal shown at the moment of refusal. |
| `PurchaseHistoryPage`    | presentational | Paginated purchase records.                                 |
| `UsageHistoryPage`       | presentational | Paginated usage records.                                    |
| `CreditHistoryPage`      | connected     | Both history feeds via `consumables_client` hooks.          |
| `CreditBalanceBadge`     | presentational | Inline balance pill.                                        |
| `RedeemCreditCouponPage` / `ManageCreditCouponsPage` | connected | Coupon redemption / admin management over `ConsumablesApiClient`. |

## Install

The `@sudobility/*` packages are published to **GitHub Packages**, not the public
npm registry. The consuming app needs an `.npmrc` pointing the scope at that
registry (with a GitHub token that has `read:packages`), e.g.:

```
@sudobility:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Then:

```bash
bun add @sudobility/consumables_pages_rn
```

This is a plain React Native library (no Expo config); it works in both Expo and
bare RN apps.

Peers (install in the host app): `react` (>=18), `react-native` (>=0.74),
`@sudobility/consumables_client`, `@sudobility/design`, `@sudobility/types`, and
`react-native-purchases` (>=7, **optional** — only needed for the RevenueCat
connected store and adapter). The host's NativeWind/Tailwind config must scan
this package so its semantic classes (`bg-primary`, `text-foreground`, …) are
generated.

## Scripts

```bash
bun run typecheck     # tsc --noEmit
bun run lint          # eslint (zero warnings allowed)
bun run lint:fix      # eslint --fix
bun run format        # prettier --write src
bun run format:check  # prettier --check src
bun run test:unit     # vitest (RN components under a jsdom + react-native mock)
bun run build         # tsc -> dist, then scripts/fix-esm-imports.mjs rewrites
                      #   relative imports to add .js extensions for ESM
```

There is no `test` script; use `test:unit`. CI/CD (`.github/workflows/ci-cd.yml`)
runs the shared `johnqh/workflows` pipeline and publishes to GitHub Packages on
push to `main`/`develop`.

Metro consumes `src/index.ts` directly (`react-native` export condition);
`dist` is the compiled output for non-Metro tooling.
