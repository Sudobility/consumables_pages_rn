/**
 * How an app gets this package, and what it gets.
 *
 * Two things that every other test here is blind to:
 *
 * - NativeWind styles a `className` only in JSX the *app's* Babel compiles.
 *   The components put `className` on core React Native components, so Metro
 *   must be handed `src`, not the precompiled `dist` -- which calls
 *   `react/jsx-runtime` directly and renders every page as unstyled lines of
 *   text. Metro honours `exports` before the top-level field, so both must say
 *   so, and `src` must be in what is published.
 * - The public surface is @sudobility/consumables_pages', name for name. The
 *   web's five adapter functions are spelled `…Web…` there and `…RN…` here;
 *   everything else is identical.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const pkg = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8')
);

describe('how an app consumes the package', () => {
  it('hands Metro the source, by the field and by the export condition', () => {
    expect(pkg['react-native']).toBe('src/index.ts');
    expect(pkg.exports['.']['react-native']).toBe('./src/index.ts');
  });

  it('offers the source before the compiled build', () => {
    // Conditions are matched in the order written: `import` first would win.
    const conditions = Object.keys(pkg.exports['.']);
    expect(conditions.indexOf('react-native')).toBeGreaterThan(-1);
    expect(conditions.indexOf('react-native')).toBeLessThan(
      conditions.indexOf('import')
    );
    expect(conditions.indexOf('react-native')).toBeLessThan(
      conditions.indexOf('require')
    );
  });

  it('publishes the source Metro is pointed at', () => {
    // No `files` list publishes everything; one that exists must name `src`.
    if (pkg.files !== undefined) expect(pkg.files).toContain('src');
  });

  it('asks the host for what its source imports', () => {
    for (const peer of [
      'react',
      'react-native',
      'nativewind',
      'react-native-svg',
      '@sudobility/consumables_client',
      '@sudobility/design',
      '@sudobility/types',
    ]) {
      expect(pkg.peerDependencies[peer], peer).toBeDefined();
      expect(pkg.dependencies?.[peer], peer).toBeUndefined();
    }
  });

  it('needs the purchase SDK only where a purchase is made', () => {
    expect(pkg.peerDependencies['react-native-purchases']).toBeDefined();
    expect(pkg.peerDependenciesMeta['react-native-purchases'].optional).toBe(
      true
    );
  });
});

describe('the public surface', () => {
  it('is the web package’s, name for name', async () => {
    const surface = await import('../index');
    expect(Object.keys(surface).sort()).toEqual(
      [
        'CreditBalanceBadge',
        'CreditHistoryPage',
        'CreditPaywallDialog',
        'CreditStorePage',
        'ManageCreditCouponsPage',
        'PurchaseHistoryPage',
        'RedeemCreditCouponPage',
        'RevenueCatCreditStore',
        'UsageHistoryPage',
        // The web's configure/create/set/clear/hasConsumablesWeb…, for the
        // React Native SDK.
        'clearConsumablesRNUser',
        'configureConsumablesRNAdapter',
        'createConsumablesRNAdapter',
        'hasConsumablesRNUser',
        'setConsumablesRNUser',
      ].sort()
    );
  });
});
