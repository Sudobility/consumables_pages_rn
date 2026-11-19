/**
 * The connected ledger, held to @sudobility/consumables_pages'
 * CreditHistoryPage: which hooks it reads, with what page size, and how their
 * state reaches the two presentational pages.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  usePurchaseHistory,
  useUsageHistory,
} from '@sudobility/consumables_client';
import { CreditHistoryPage } from '../CreditHistoryPage';
import type { CreditHistoryPageProps } from '../CreditHistoryPage';
import { firePress, render } from './test-utils';

vi.mock('@sudobility/consumables_client', () => ({
  usePurchaseHistory: vi.fn(),
  useUsageHistory: vi.fn(),
}));

const purchaseHook = vi.mocked(usePurchaseHistory);
const usageHook = vi.mocked(useUsageHistory);

const purchase = (id: number) => ({
  id,
  credits: 25,
  source: 'web',
  transaction_ref_id: `txn_${id}`,
  product_id: 'credits_25',
  price_cents: 1999,
  currency: 'USD',
  created_at: `purchase-${id}`,
});

const usage = (id: number) => ({
  id,
  filename: `file-${id}.svg`,
  created_at: `usage-${id}`,
});

function feeds(
  overrides: {
    purchases?: Partial<ReturnType<typeof usePurchaseHistory>>;
    usages?: Partial<ReturnType<typeof useUsageHistory>>;
  } = {}
) {
  const purchases = {
    purchases: [],
    isLoading: false,
    error: null,
    loadMore: vi.fn().mockResolvedValue(undefined),
    refetch: vi.fn(),
    ...overrides.purchases,
  };
  const usages = {
    usages: [],
    isLoading: false,
    error: null,
    loadMore: vi.fn().mockResolvedValue(undefined),
    refetch: vi.fn(),
    ...overrides.usages,
  };
  purchaseHook.mockReturnValue(
    purchases as unknown as ReturnType<typeof usePurchaseHistory>
  );
  usageHook.mockReturnValue(
    usages as unknown as ReturnType<typeof useUsageHistory>
  );
  return { purchases, usages };
}

const props: CreditHistoryPageProps = {
  purchaseLabels: {
    title: 'Purchases',
    columnDate: 'Date',
    columnCredits: 'Credits',
    columnSource: 'Source',
    columnProduct: 'Product',
    columnAmount: 'Amount',
    noRecords: 'No purchases yet',
    loadMore: 'More purchases',
  },
  purchaseFormatters: {
    formatDate: d => d,
    formatAmount: (cents, currency) => `${currency} ${cents / 100}`,
    formatSource: s => s,
  },
  usageLabels: {
    title: 'Usage',
    columnDate: 'Date',
    columnFilename: 'File',
    noRecords: 'No usage yet',
    loadMore: 'More usage',
  },
  usageFormatters: { formatDate: d => d },
};

beforeEach(() => {
  purchaseHook.mockReset();
  usageHook.mockReset();
});

describe('CreditHistoryPage', () => {
  it('reads both feeds fifty records at a time unless told otherwise', async () => {
    feeds();
    const first = await render(<CreditHistoryPage {...props} />);
    expect(purchaseHook).toHaveBeenLastCalledWith(50);
    expect(usageHook).toHaveBeenLastCalledWith(50);
    first.unmount();

    await render(<CreditHistoryPage {...props} pageSize={20} />);
    expect(purchaseHook).toHaveBeenLastCalledWith(20);
    expect(usageHook).toHaveBeenLastCalledWith(20);
  });

  it('prints purchases, then usage', async () => {
    feeds({
      purchases: { purchases: [purchase(1)] },
      usages: { usages: [usage(1)] },
    });
    const { container } = await render(<CreditHistoryPage {...props} />);
    expect(
      Array.from(container.querySelectorAll('[role="heading"]')).map(
        node => node.textContent
      )
    ).toEqual(['Purchases', 'Usage']);
    expect(container.textContent).toContain('purchase-1');
    expect(container.textContent).toContain('file-1.svg');
  });

  it('offers to buy credits only when the host can take the user there', async () => {
    feeds();
    const without = await render(<CreditHistoryPage {...props} />);
    expect(without.queryByText('Purchase credits')).toBeNull();
    without.unmount();

    const onPurchaseCredits = vi.fn();
    const withDefault = await render(
      <CreditHistoryPage {...props} onPurchaseCredits={onPurchaseCredits} />
    );
    firePress(withDefault.getByText('Purchase credits'));
    expect(onPurchaseCredits).toHaveBeenCalledTimes(1);
    withDefault.unmount();

    const named = await render(
      <CreditHistoryPage
        {...props}
        onPurchaseCredits={onPurchaseCredits}
        purchaseButtonLabel='Top up'
      />
    );
    expect(named.queryByText('Top up')).not.toBeNull();
    expect(named.queryByText('Purchase credits')).toBeNull();
  });

  it('shows both feeds as loading while either is', async () => {
    feeds({
      purchases: { purchases: [purchase(1)] },
      usages: { isLoading: true },
    });
    const { container, queryByText } = await render(
      <CreditHistoryPage {...props} />
    );
    expect(
      container.querySelectorAll('[data-testid="ActivityIndicator"]')
    ).toHaveLength(2);
    expect(queryByText('purchase-1')).toBeNull();
  });

  it('shows either feed’s error on both, the purchase feed’s first', async () => {
    feeds({ usages: { error: new Error('Usage unavailable') } });
    const usageOnly = await render(<CreditHistoryPage {...props} />);
    expect(usageOnly.getAllByText('Usage unavailable')).toHaveLength(2);
    usageOnly.unmount();

    feeds({
      purchases: { error: new Error('Purchases unavailable') },
      usages: { error: new Error('Usage unavailable') },
    });
    const both = await render(<CreditHistoryPage {...props} />);
    expect(both.getAllByText('Purchases unavailable')).toHaveLength(2);
    expect(both.queryByText('Usage unavailable')).toBeNull();
  });

  it('offers more of a feed only when its last page came back full', async () => {
    const { purchases, usages } = feeds({
      // Two full pages of two: there may be a third.
      purchases: { purchases: [1, 2, 3, 4].map(purchase) },
      // A page and a half: that was the end.
      usages: { usages: [1, 2, 3].map(usage) },
    });
    const { getByText, queryByText } = await render(
      <CreditHistoryPage {...props} pageSize={2} />
    );

    expect(queryByText('More usage')).toBeNull();
    firePress(getByText('More purchases'));
    expect(purchases.loadMore).toHaveBeenCalledTimes(1);
    expect(usages.loadMore).not.toHaveBeenCalled();
  });

  it('loads more usage from the usage feed', async () => {
    const { purchases, usages } = feeds({
      usages: { usages: [1, 2].map(usage) },
    });
    const { getByText, queryByText } = await render(
      <CreditHistoryPage {...props} pageSize={2} />
    );

    expect(queryByText('More purchases')).toBeNull();
    firePress(getByText('More usage'));
    expect(usages.loadMore).toHaveBeenCalledTimes(1);
    expect(purchases.loadMore).not.toHaveBeenCalled();
  });
});
