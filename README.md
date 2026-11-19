# @sudobility/consumables_pages_rn

React Native UI components for consumable credits — the RN mirror of
[`@sudobility/consumables_pages`](https://github.com/Sudobility/consumables_pages).
Same exports, same props, same sections, wording and states; only the five
adapter functions are named for their platform (`…RN…` here, `…Web…` there).

These are **UI components only**. All business logic (balance tracking, product
loading, purchases, coupon redemption, history) lives in
[`@sudobility/consumables_client`](https://github.com/Sudobility/consumables_client);
the components here take data and callbacks via props, or — for the "connected"
variants — call the client's hooks and render the presentational pieces.

## Components

| Component                | Kind          | Notes                                                        |
| ------------------------ | ------------- | ------------------------------------------------------------ |
| `CreditStorePage`        | presentational | Balance panel + grid of credit packages with buy buttons: one, two or three to a row by window width. Data via props. |
| `RevenueCatCreditStore`  | connected     | Loads products/balance via `consumables_client`, renders `CreditStorePage`. |
| `CreditPaywallDialog`    | presentational | `CreditStorePage` in a modal shown at the moment of refusal. |
| `PurchaseHistoryPage`    | presentational | Paginated purchase records: a table with column headers on a wide window, cards on a narrow one. |
| `UsageHistoryPage`       | presentational | Paginated usage records, laid out the same way.             |
| `CreditHistoryPage`      | connected     | Both history feeds via `consumables_client` hooks.          |
| `CreditBalanceBadge`     | presentational | Inline balance pill.                                        |
| `RedeemCreditCouponPage` | connected     | Coupon redemption form over `ConsumablesApiClient` (copy is hardcoded English, as on the web). |
| `ManageCreditCouponsPage`| connected     | Site-admin coupon creation, list, detail and redemption history. Scrolls itself; takes `contentContainerStyle` for the host's safe-area scroll insets. |

"Wide" is the web's `sm` breakpoint (640) and "three to a row" its `lg` (1024),
read from the window width — so a tablet or a desktop window gets the layout the
web gives a window that wide, and a phone gets the web's phone layout.

The prop, label and formatter types (`CreditStorePageProps`,
`PurchaseHistoryPageLabels`, …) are exported from the package root and are the
web package's, field for field.

## React Native RevenueCat adapter

Implements `consumables_client`'s `ConsumablesAdapter` over
`react-native-purchases`. Inject via
`initializeConsumables({ adapter: createConsumablesRNAdapter() })` after
`configureConsumablesRNAdapter(apiKey)`. Exports:
`configureConsumablesRNAdapter`, `createConsumablesRNAdapter`,
`setConsumablesRNUser`, `clearConsumablesRNUser`, `hasConsumablesRNUser`.

As on the web, the catalog can be read before anybody signs in, but a purchase
is refused (`RevenueCat user not set`) until a user is set — normally by
`setConsumablesUserId()` from `consumables_client` on sign-in.

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
`nativewind` (>=4), `react-native-svg` (>=13), `@sudobility/consumables_client`,
`@sudobility/design`, `@sudobility/types`, and `react-native-purchases` (>=7,
**optional** — only needed for the RevenueCat connected store and adapter).

### Tailwind setup

The components are styled with NativeWind `className`, and Metro reads them from
this package's `src` (the `react-native` field and export condition), so the
app's Babel compiles them like the app's own screens. The app must still tell
Tailwind to scan the package, or the classes only it uses are never generated
and the components render unstyled:

```js
// tailwind.config.js
content: [
  './src/**/*.{js,jsx,ts,tsx}',
  './node_modules/@sudobility/consumables_pages_rn/{src,dist}/**/*.{js,jsx,ts,tsx}',
  './node_modules/@sudobility/design/dist/**/*.{js,jsx}',
],
```

Every colour is a semantic token of the `@sudobility/design` preset
(`bg-primary`, `text-foreground`, `text-info`, `bg-warning/10`, …), so the host's
theme reaches all of it.

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
