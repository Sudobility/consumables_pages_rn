import { describe, it, expect, vi } from 'vitest';
import { CreditStorePage } from '../CreditStorePage';
import type { CreditStorePageProps } from '../types';
import { render, firePress } from './test-utils';

const defaultLabels: CreditStorePageProps['labels'] = {
  title: 'Credit Store',
  currentBalanceLabel: 'Current Balance',
  creditsUnit: 'credits',
  purchaseButton: 'Buy',
  purchasingButton: 'Purchasing...',
  noProducts: 'No products available',
  errorTitle: 'Error',
  loginRequired: 'Please log in to purchase credits',
};

const defaultFormatters: CreditStorePageProps['formatters'] = {
  formatCredits: count => `${count} credits`,
};

const packages = [
  {
    packageId: 'pkg_5',
    productId: 'credits_5',
    title: '5 Credits',
    description: null,
    credits: 5,
    price: 4.99,
    priceString: '$4.99',
    currencyCode: 'USD',
  },
  {
    packageId: 'pkg_25',
    productId: 'credits_25',
    title: '25 Credits',
    description: null,
    credits: 25,
    price: 19.99,
    priceString: '$19.99',
    currencyCode: 'USD',
  },
];

function base(
  overrides: Partial<CreditStorePageProps> = {}
): CreditStorePageProps {
  return {
    isAuthenticated: true,
    balance: 10,
    packages: [],
    isLoading: false,
    isPurchasing: false,
    error: null,
    onPurchase: vi.fn(),
    onLoginClick: vi.fn(),
    labels: defaultLabels,
    formatters: defaultFormatters,
    ...overrides,
  };
}

describe('CreditStorePage', () => {
  it('should show balance when authenticated', async () => {
    const { queryByText } = await render(<CreditStorePage {...base()} />);
    expect(queryByText('10 credits')).not.toBeNull();
    expect(queryByText('Current Balance')).not.toBeNull();
  });

  it('should show login prompt when not authenticated', async () => {
    const { queryByText } = await render(
      <CreditStorePage {...base({ isAuthenticated: false, balance: null })} />
    );
    expect(queryByText('Please log in to purchase credits')).not.toBeNull();
  });

  it('should show loading spinner', async () => {
    const { container } = await render(
      <CreditStorePage {...base({ isLoading: true })} />
    );
    expect(
      container.querySelector('[data-testid="ActivityIndicator"]')
    ).not.toBeNull();
  });

  it('should show error message', async () => {
    const { queryByText } = await render(
      <CreditStorePage {...base({ error: 'Something went wrong' })} />
    );
    expect(queryByText('Something went wrong')).not.toBeNull();
  });

  it('should render packages with buy buttons', async () => {
    const { queryByText, getAllByText } = await render(
      <CreditStorePage {...base({ packages })} />
    );
    expect(queryByText('5 credits')).not.toBeNull();
    expect(queryByText('25 credits')).not.toBeNull();
    expect(queryByText('$4.99')).not.toBeNull();
    expect(queryByText('$19.99')).not.toBeNull();
    expect(getAllByText('Buy')).toHaveLength(2);
  });

  it('should call onPurchase when buy button pressed', async () => {
    const onPurchase = vi.fn();
    const { getAllByText } = await render(
      <CreditStorePage {...base({ packages, onPurchase })} />
    );
    firePress(getAllByText('Buy')[0]);
    expect(onPurchase).toHaveBeenCalledWith('pkg_5');
  });

  it('should show the purchasing label on every button when purchasing', async () => {
    const { getAllByText } = await render(
      <CreditStorePage {...base({ packages, isPurchasing: true })} />
    );
    expect(getAllByText('Purchasing...')).toHaveLength(2);
  });

  it('should show no products message', async () => {
    const { queryByText } = await render(<CreditStorePage {...base()} />);
    expect(queryByText('No products available')).not.toBeNull();
  });
});
