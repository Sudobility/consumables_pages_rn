import { describe, it, expect, vi } from 'vitest';
import { CreditPaywallDialog } from '../CreditPaywallDialog';
import type { CreditPaywallDialogProps } from '../types';
import { render, firePress, pressKey } from './test-utils';

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
    const { queryByText, container } = await renderDialog();
    const heading = container.querySelector('[role="heading"]');
    expect(heading?.textContent).toBe('Out of credits');
    expect(queryByText('Top up to carry on.')).not.toBeNull();
  });

  it('is modal to assistive technology', async () => {
    const { container, getByText } = await renderDialog();
    const panel = container.querySelector('[aria-modal="true"]');
    expect(panel).not.toBeNull();
    expect(panel?.contains(getByText('Out of credits'))).toBe(true);
  });

  it('shows the packages it was given', async () => {
    const { queryByText, getAllByText } = await renderDialog();
    expect(queryByText('$4.99')).not.toBeNull();
    expect(getAllByText('Buy')).toHaveLength(1);
  });

  it('prints one heading, not the store’s as well', async () => {
    // The store renders its own heading; inside the dialog that would be a
    // second title saying the same thing.
    const { queryByText, container } = await renderDialog();
    expect(queryByText('Credit Store')).toBeNull();
    expect(container.querySelectorAll('[role="heading"]')).toHaveLength(1);
  });

  it('buys the package that was pressed', async () => {
    const { props, getAllByText } = await renderDialog();
    firePress(getAllByText('Buy')[0]);
    expect(props.onPurchase).toHaveBeenCalledWith('pkg_5');
  });

  it('closes on the close control', async () => {
    const { props, container } = await renderDialog();
    firePress(
      container.querySelector(
        '[role="button"][aria-label="Close"]'
      ) as HTMLElement
    );
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on the back button, the web dialog’s Escape', async () => {
    const { props, container } = await renderDialog();
    pressKey(
      container.querySelector('[data-testid="Modal"]') as HTMLElement,
      'Escape'
    );
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on the screen reader’s escape gesture', async () => {
    const { props, container } = await renderDialog();
    pressKey(
      container.querySelector('[aria-modal="true"]') as HTMLElement,
      'Escape'
    );
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on a press on the backdrop', async () => {
    const { props, container } = await renderDialog();
    const backdrop = container.querySelector(
      '[data-testid="Pressable"]'
    ) as HTMLElement;
    firePress(backdrop);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('stays open when the press lands inside the panel', async () => {
    // The backdrop lies under the panel, not around it: a press on the
    // heading, the store or a Buy button must not dismiss what the user is
    // reading.
    const { props, getByText, getAllByText } = await renderDialog();
    firePress(getByText('Out of credits'));
    firePress(getByText('$4.99'));
    firePress(getAllByText('Buy')[0]);
    expect(props.onClose).not.toHaveBeenCalled();
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
