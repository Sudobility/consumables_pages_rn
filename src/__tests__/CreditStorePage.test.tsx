import { describe, it, expect, vi } from 'vitest';
import { __setWindowWidth } from 'react-native';
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

  it('should disable buttons when purchasing', async () => {
    const onPurchase = vi.fn();
    const { getAllByText } = await render(
      <CreditStorePage
        {...base({ packages, isPurchasing: true, onPurchase })}
      />
    );
    const labels = getAllByText('Purchasing...');
    expect(labels).toHaveLength(2);
    const button = labels[0].closest('[role="button"]') as HTMLElement;
    expect(button.getAttribute('aria-disabled')).toBe('true');
    firePress(labels[0]);
    expect(onPurchase).not.toHaveBeenCalled();
  });

  it('should disable buttons when signed out', async () => {
    const onPurchase = vi.fn();
    const { getAllByText } = await render(
      <CreditStorePage
        {...base({ packages, isAuthenticated: false, onPurchase })}
      />
    );
    firePress(getAllByText('Buy')[0]);
    expect(onPurchase).not.toHaveBeenCalled();
  });

  it('should offer login when signed out', async () => {
    const onLoginClick = vi.fn();
    const { getByText } = await render(
      <CreditStorePage
        {...base({ isAuthenticated: false, balance: null, onLoginClick })}
      />
    );
    firePress(getByText('Log in'));
    expect(onLoginClick).toHaveBeenCalledTimes(1);
  });

  it('should name the login button as the host asks', async () => {
    const { queryByText } = await render(
      <CreditStorePage
        {...base({
          isAuthenticated: false,
          balance: null,
          labels: { ...defaultLabels, loginButton: 'Sign in' },
        })}
      />
    );
    expect(queryByText('Sign in')).not.toBeNull();
    expect(queryByText('Log in')).toBeNull();
  });

  it('should show both descriptions a package has', async () => {
    const { queryByText } = await render(
      <CreditStorePage
        {...base({
          packages: [{ ...packages[0], description: 'Starter pack' }],
          formatters: {
            ...defaultFormatters,
            getPackageDescription: id => `About ${id}`,
          },
        })}
      />
    );
    expect(queryByText('Starter pack')).not.toBeNull();
    expect(queryByText('About pkg_5')).not.toBeNull();
  });

  it('should print a heading, and none when the title is empty', async () => {
    const titled = await render(<CreditStorePage {...base()} />);
    expect(titled.container.querySelectorAll('[role="heading"]')).toHaveLength(
      1
    );
    expect(titled.queryByText('Credit Store')).not.toBeNull();
    titled.unmount();

    const untitled = await render(
      <CreditStorePage {...base({ labels: { ...defaultLabels, title: '' } })} />
    );
    expect(untitled.container.querySelector('[role="heading"]')).toBeNull();
  });

  it('should show no products message', async () => {
    const { queryByText } = await render(<CreditStorePage {...base()} />);
    expect(queryByText('No products available')).not.toBeNull();
  });

  it('should hide the no products message while loading', async () => {
    const { queryByText } = await render(
      <CreditStorePage {...base({ isLoading: true })} />
    );
    expect(queryByText('No products available')).toBeNull();
  });
});

describe('CreditStorePage: the web grid, by window width', () => {
  // The web's `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
  async function cellClasses(width: number) {
    __setWindowWidth(width);
    const { getAllByText } = await render(
      <CreditStorePage {...base({ packages })} />
    );
    return getAllByText('Buy').map(label => {
      // label -> button -> centring view -> card -> grid cell
      const cell = label.parentElement?.parentElement?.parentElement
        ?.parentElement as HTMLElement;
      return cell.getAttribute('class');
    });
  }

  it('stacks packages one to a row on a phone', async () => {
    expect(await cellClasses(390)).toEqual(['p-2 w-full', 'p-2 w-full']);
  });

  it('puts two to a row from the sm breakpoint', async () => {
    expect(await cellClasses(640)).toEqual(['p-2 w-1/2', 'p-2 w-1/2']);
  });

  it('puts three to a row from the lg breakpoint', async () => {
    expect(await cellClasses(1024)).toEqual(['p-2 w-1/3', 'p-2 w-1/3']);
  });
});
