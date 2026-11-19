import { describe, it, expect, vi } from 'vitest';
import { __setWindowWidth } from 'react-native';
import { PurchaseHistoryPage } from '../PurchaseHistoryPage';
import type { PurchaseHistoryPageProps } from '../types';
import { render, firePress } from './test-utils';

const defaultLabels: PurchaseHistoryPageProps['labels'] = {
  title: 'Purchase History',
  columnDate: 'Date',
  columnCredits: 'Credits',
  columnSource: 'Source',
  columnProduct: 'Product',
  columnAmount: 'Amount',
  noRecords: 'No purchases yet',
  loadMore: 'Load More',
};

const defaultFormatters: PurchaseHistoryPageProps['formatters'] = {
  formatDate: d => d,
  formatAmount: (cents, currency) => `${currency} ${(cents / 100).toFixed(2)}`,
  formatSource: s => s,
};

const purchases = [
  {
    id: 1,
    credits: 25,
    source: 'web',
    transaction_ref_id: 'txn_1',
    product_id: 'credits_25',
    price_cents: 1999,
    currency: 'USD',
    created_at: '2025-01-15',
  },
  {
    id: 2,
    credits: 3,
    source: 'free',
    transaction_ref_id: null,
    product_id: null,
    price_cents: null,
    currency: null,
    created_at: '2025-01-01',
  },
];

function base(
  overrides: Partial<PurchaseHistoryPageProps> = {}
): PurchaseHistoryPageProps {
  return {
    purchases: [],
    isLoading: false,
    error: null,
    labels: defaultLabels,
    formatters: defaultFormatters,
    ...overrides,
  };
}

describe('PurchaseHistoryPage', () => {
  it('should show title', async () => {
    const { queryByText } = await render(<PurchaseHistoryPage {...base()} />);
    expect(queryByText('Purchase History')).not.toBeNull();
  });

  it('should show no records message when empty', async () => {
    const { queryByText } = await render(<PurchaseHistoryPage {...base()} />);
    expect(queryByText('No purchases yet')).not.toBeNull();
  });

  it('should show loading spinner', async () => {
    const { container } = await render(
      <PurchaseHistoryPage {...base({ isLoading: true })} />
    );
    expect(
      container.querySelector('[data-testid="ActivityIndicator"]')
    ).not.toBeNull();
  });

  it('should show error message', async () => {
    const { queryByText } = await render(
      <PurchaseHistoryPage {...base({ error: 'Failed to load' })} />
    );
    expect(queryByText('Failed to load')).not.toBeNull();
  });

  it('should render purchase records', async () => {
    const { getAllByText, queryByText } = await render(
      <PurchaseHistoryPage {...base({ purchases })} />
    );
    expect(getAllByText('+25')).toHaveLength(1);
    expect(getAllByText('+3')).toHaveLength(1);
    expect(queryByText('USD 19.99')).not.toBeNull();
    expect(queryByText('2025-01-01')).not.toBeNull();
  });

  it('should show load more button when hasMore', async () => {
    const onLoadMore = vi.fn();
    const { getByText } = await render(
      <PurchaseHistoryPage
        {...base({ purchases, onLoadMore, hasMore: true })}
      />
    );
    firePress(getByText('Load More'));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('should not show load more when hasMore is false', async () => {
    const { queryByText } = await render(
      <PurchaseHistoryPage {...base({ purchases, hasMore: false })} />
    );
    expect(queryByText('Load More')).toBeNull();
  });

  it('should render a custom empty state in place of the message', async () => {
    const { queryByText } = await render(
      <PurchaseHistoryPage
        {...base({ emptyStateComponent: <span>Nothing bought</span> })}
      />
    );
    expect(queryByText('Nothing bought')).not.toBeNull();
    expect(queryByText('No purchases yet')).toBeNull();
  });
});

describe('PurchaseHistoryPage: cards on a narrow window', () => {
  // The web's `sm:hidden` cards: what a phone gets.
  it('prints no column headers', async () => {
    const { queryByText } = await render(
      <PurchaseHistoryPage {...base({ purchases })} />
    );
    for (const header of ['Date', 'Credits', 'Source', 'Amount']) {
      expect(queryByText(header)).toBeNull();
    }
  });

  it('leaves the amount out of a purchase without a price', async () => {
    const { container } = await render(
      <PurchaseHistoryPage {...base({ purchases: [purchases[1]] })} />
    );
    expect(container.textContent).toBe('Purchase History2025-01-01free+3');
  });
});

describe('PurchaseHistoryPage: table from the sm breakpoint', () => {
  // The web's `hidden sm:block` table: what a tablet or a desktop window gets.
  async function renderWide(overrides: Partial<PurchaseHistoryPageProps> = {}) {
    __setWindowWidth(640);
    return render(
      <PurchaseHistoryPage {...base({ purchases, ...overrides })} />
    );
  }

  it('heads the columns date, credits, source and amount, in that order', async () => {
    const { container } = await renderWide();
    const headerRow = container.querySelector('.border-border') as HTMLElement;
    expect(
      Array.from(headerRow.children).map(cell => cell.textContent)
    ).toEqual(['Date', 'Credits', 'Source', 'Amount']);
  });

  it('prints each purchase once, as a row', async () => {
    const { getAllByText, queryByText, container } = await renderWide();
    expect(getAllByText('+25')).toHaveLength(1);
    expect(getAllByText('+3')).toHaveLength(1);
    expect(queryByText('USD 19.99')).not.toBeNull();
    const rows = container.querySelectorAll('.border-border\\/50');
    expect(rows).toHaveLength(2);
    expect(Array.from(rows[0].children).map(cell => cell.textContent)).toEqual([
      '2025-01-15',
      '+25',
      'web',
      'USD 19.99',
    ]);
  });

  it('should show dash for purchases without price', async () => {
    const { container } = await renderWide();
    const rows = container.querySelectorAll('.border-border\\/50');
    expect(Array.from(rows[1].children).map(cell => cell.textContent)).toEqual([
      '2025-01-01',
      '+3',
      'free',
      '-',
    ]);
  });

  it('keeps load more under the table', async () => {
    const onLoadMore = vi.fn();
    const { getByText } = await renderWide({ onLoadMore, hasMore: true });
    firePress(getByText('Load More'));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});
