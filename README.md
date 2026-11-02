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

```bash
bun add @sudobility/consumables_pages_rn
```

Peers: `react`, `react-native`, `@sudobility/consumables_client`,
`@sudobility/design`, `@sudobility/types`. The host's NativeWind/Tailwind config
must scan this package so its semantic classes (`bg-primary`, `text-foreground`,
…) are generated.

## Scripts

```bash
bun run typecheck   # tsc --noEmit
bun run lint        # eslint
bun run test:unit   # vitest (RN components under a jsdom + react-native mock)
bun run build       # tsc -> dist
```

Metro consumes `src/index.ts` directly (`react-native` export condition);
`dist` is the compiled output for non-Metro tooling.
