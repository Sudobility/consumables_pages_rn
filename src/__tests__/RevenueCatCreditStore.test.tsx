/**
 * The connected store, held to @sudobility/consumables_pages'
 * RevenueCatCreditStore: which hooks it reads, and what a purchase is asked
 * for -- the store's own package id and the offering the package came from.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useBalance,
  useConsumableProducts,
  usePurchaseCredits,
} from '@sudobility/consumables_client';
import { RevenueCatCreditStore } from '../RevenueCatCreditStore';
import type { RevenueCatCreditStoreProps } from '../RevenueCatCreditStore';
import { firePress, flushPromises, render } from './test-utils';

vi.mock('@sudobility/consumables_client', () => ({
  useBalance: vi.fn(),
  useConsumableProducts: vi.fn(),
  usePurchaseCredits: vi.fn(),
}));

const balanceHook = vi.mocked(useBalance);
const productsHook = vi.mocked(useConsumableProducts);
const purchaseHook = vi.mocked(usePurchaseCredits);

const pkg = {
  // What the client hands the UI: the offering folded into the id.
  packageId: 'credits::pkg_5',
  storePackageId: 'pkg_5',
  offeringId: 'credits',
  productId: 'credits_5',
  title: '5 Credits',
  description: null,
  credits: 5,
  price: 4.99,
  priceString: '$4.99',
  currencyCode: 'USD',
};

function hooks(
  overrides: {
    balance?: Record<string, unknown>;
    products?: Record<string, unknown>;
    purchase?: Record<string, unknown>;
  } = {}
) {
  const purchase = vi.fn().mockResolvedValue(true);
  balanceHook.mockReturnValue({
    balance: 7,
    isLoading: false,
    error: null,
    ...overrides.balance,
  } as unknown as ReturnType<typeof useBalance>);
  productsHook.mockReturnValue({
    packages: [pkg],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    ...overrides.products,
  } as unknown as ReturnType<typeof useConsumableProducts>);
  purchaseHook.mockReturnValue({
    purchase,
    isPurchasing: false,
    error: null,
    ...overrides.purchase,
  } as unknown as ReturnType<typeof usePurchaseCredits>);
  return { purchase };
}

const props: RevenueCatCreditStoreProps = {
  offeringId: 'credits',
  isAuthenticated: true,
  onLoginClick: vi.fn(),
  labels: {
    title: 'Credit Store',
    currentBalanceLabel: 'Current Balance',
    creditsUnit: 'credits',
    purchaseButton: 'Buy',
    purchasingButton: 'Purchasing...',
    noProducts: 'No products available',
    errorTitle: 'Error',
    loginRequired: 'Please log in to purchase credits',
  },
  formatters: { formatCredits: count => `${count} credits` },
};

beforeEach(() => {
  balanceHook.mockReset();
  productsHook.mockReset();
  purchaseHook.mockReset();
});

describe('RevenueCatCreditStore', () => {
  it('shows the balance and the packages of the offering it was given', async () => {
    hooks();
    const { queryByText } = await render(<RevenueCatCreditStore {...props} />);
    expect(productsHook).toHaveBeenLastCalledWith('credits');
    expect(queryByText('7 credits')).not.toBeNull();
    expect(queryByText('5 credits')).not.toBeNull();
    expect(queryByText('$4.99')).not.toBeNull();
  });

  it('buys by the store’s package id, from the offering the package came from', async () => {
    const { purchase } = hooks({
      products: { packages: [{ ...pkg, offeringId: 'bonus' }] },
    });
    const { getByText } = await render(<RevenueCatCreditStore {...props} />);
    firePress(getByText('Buy'));
    await flushPromises();
    expect(purchase).toHaveBeenCalledTimes(1);
    expect(purchase).toHaveBeenCalledWith('pkg_5', 'bonus');
  });

  it('falls back to the package id and its own offering', async () => {
    const { purchase } = hooks({
      products: {
        packages: [
          {
            ...pkg,
            packageId: 'pkg_5',
            storePackageId: undefined,
            offeringId: undefined,
          },
        ],
      },
    });
    const { getByText } = await render(<RevenueCatCreditStore {...props} />);
    firePress(getByText('Buy'));
    await flushPromises();
    expect(purchase).toHaveBeenCalledWith('pkg_5', 'credits');
  });

  it('is loading while the balance or the catalog is', async () => {
    hooks({ balance: { balance: null, isLoading: true } });
    const balanceLoading = await render(<RevenueCatCreditStore {...props} />);
    expect(
      balanceLoading.container.querySelector(
        '[data-testid="ActivityIndicator"]'
      )
    ).not.toBeNull();
    balanceLoading.unmount();

    hooks({ products: { packages: [], isLoading: true } });
    const catalogLoading = await render(<RevenueCatCreditStore {...props} />);
    expect(
      catalogLoading.container.querySelector(
        '[data-testid="ActivityIndicator"]'
      )
    ).not.toBeNull();
  });

  it('shows the purchase’s error before the balance’s, and that before the catalog’s', async () => {
    hooks({
      balance: { error: new Error('Balance unavailable') },
      products: { error: new Error('Catalog unavailable') },
      purchase: { error: new Error('Purchase failed') },
    });
    const all = await render(<RevenueCatCreditStore {...props} />);
    expect(all.queryByText('Purchase failed')).not.toBeNull();
    expect(all.queryByText('Balance unavailable')).toBeNull();
    all.unmount();

    hooks({
      balance: { error: new Error('Balance unavailable') },
      products: { error: new Error('Catalog unavailable') },
    });
    const two = await render(<RevenueCatCreditStore {...props} />);
    expect(two.queryByText('Balance unavailable')).not.toBeNull();
    expect(two.queryByText('Catalog unavailable')).toBeNull();
    two.unmount();

    hooks({ products: { error: new Error('Catalog unavailable') } });
    const one = await render(<RevenueCatCreditStore {...props} />);
    expect(one.queryByText('Catalog unavailable')).not.toBeNull();
  });

  it('says it is purchasing while a purchase is under way', async () => {
    hooks({ purchase: { isPurchasing: true } });
    const { queryByText } = await render(<RevenueCatCreditStore {...props} />);
    expect(queryByText('Purchasing...')).not.toBeNull();
    expect(queryByText('Buy')).toBeNull();
  });
});
