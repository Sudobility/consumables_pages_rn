import { describe, it, expect, vi } from 'vitest';
import { CreditPaywallDialog } from '../CreditPaywallDialog';
import type { CreditPaywallDialogProps } from '../types';
import { render, firePress } from './test-utils';

const labels: CreditPaywallDialogProps['labels'] = {
  paywallTitle: 'Out of credits',
  paywallMessage: 'Top up to carry on.',
  closeLabel: 'Close',
  title: 'Credit Store',
  currentBalanceLabel: 'Current Balance',
  creditsUnit: 'credits',
  purchaseButton: 'Buy',
  purchasingButton: 'Purchasing...',
  noProducts: 'No products available',
  errorTitle: 'Error',
  loginRequired: 'Please log in to purchase credits',
};

const formatters: CreditPaywallDialogProps['formatters'] = {
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
];

async function renderDialog(overrides: Partial<CreditPaywallDialogProps> = {}) {
  const props: CreditPaywallDialogProps = {
    isOpen: true,
    onClose: vi.fn(),
    isAuthenticated: true,
    balance: 0,
    packages,
    isLoading: false,
    isPurchasing: false,
    error: null,
    onPurchase: vi.fn(),
    onLoginClick: vi.fn(),
    labels,
    formatters,
    ...overrides,
  };
  return { ...(await render(<CreditPaywallDialog {...props} />)), props };
}

describe('CreditPaywallDialog', () => {
  it('renders nothing when closed', async () => {
    const { queryByText } = await renderDialog({ isOpen: false });
    expect(queryByText('Out of credits')).toBeNull();
  });

  it('names itself by its heading and shows the message', async () => {
    const { queryByText } = await renderDialog();
    expect(queryByText('Out of credits')).not.toBeNull();
    expect(queryByText('Top up to carry on.')).not.toBeNull();
  });

  it('shows the packages it was given', async () => {
    const { queryByText, getAllByText } = await renderDialog();
    expect(queryByText('$4.99')).not.toBeNull();
    expect(getAllByText('Buy')).toHaveLength(1);
  });

  it('prints its own heading, not the store’s as well', async () => {
    const { queryByText } = await renderDialog();
    expect(queryByText('Out of credits')).not.toBeNull();
    expect(queryByText('Credit Store')).toBeNull();
  });

  it('buys the package that was pressed', async () => {
    const { props, getAllByText } = await renderDialog();
    firePress(getAllByText('Buy')[0]);
    expect(props.onPurchase).toHaveBeenCalledWith('pkg_5');
  });

  it('closes on the close control', async () => {
    const { props, getByText } = await renderDialog();
    firePress(getByText('×'));
    expect(props.onClose).toHaveBeenCalled();
  });

  it('closes on a press on the backdrop', async () => {
    const { props, container } = await renderDialog();
    const backdrop = container.querySelector(
      '[data-testid="Pressable"]'
    ) as HTMLElement;
    firePress(backdrop);
    expect(props.onClose).toHaveBeenCalled();
  });

  it('shows an error rather than an empty store', async () => {
    const { queryByText } = await renderDialog({ error: 'Purchase failed' });
    expect(queryByText('Purchase failed')).not.toBeNull();
  });

  it('offers login instead of purchase when signed out', async () => {
    const { props, getByText } = await renderDialog({
      isAuthenticated: false,
    });
    firePress(getByText('Log in'));
    expect(props.onLoginClick).toHaveBeenCalled();
  });
});
