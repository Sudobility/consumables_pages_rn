import { describe, it, expect, vi } from 'vitest';
import { CreditBalanceBadge } from '../CreditBalanceBadge';
import { render, firePress } from './test-utils';

describe('CreditBalanceBadge', () => {
  it('should show loading state', async () => {
    const { queryByText } = await render(
      <CreditBalanceBadge balance={null} isLoading={true} />
    );
    expect(queryByText('...')).not.toBeNull();
  });

  it('should render nothing when balance is null and not loading', async () => {
    const { container } = await render(
      <CreditBalanceBadge balance={null} isLoading={false} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('should display balance', async () => {
    const { queryByText } = await render(
      <CreditBalanceBadge balance={10} isLoading={false} />
    );
    expect(queryByText('10')).not.toBeNull();
  });

  it('should display zero balance', async () => {
    const { queryByText } = await render(
      <CreditBalanceBadge balance={0} isLoading={false} />
    );
    expect(queryByText('0')).not.toBeNull();
  });

  it('should be pressable when onClick is provided', async () => {
    const onClick = vi.fn();
    const { container } = await render(
      <CreditBalanceBadge balance={5} isLoading={false} onClick={onClick} />
    );
    const button = container.querySelector(
      '[data-testid="TouchableOpacity"]'
    ) as HTMLElement | null;
    expect(button).not.toBeNull();
    firePress(button as HTMLElement);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should render as a static view when no onClick', async () => {
    const { container } = await render(
      <CreditBalanceBadge balance={5} isLoading={false} />
    );
    expect(
      container.querySelector('[data-testid="TouchableOpacity"]')
    ).toBeNull();
  });

  it('should apply custom className', async () => {
    const { container } = await render(
      <CreditBalanceBadge balance={5} isLoading={false} className='my-class' />
    );
    expect(
      (container.firstChild as HTMLElement).getAttribute('class')
    ).toContain('my-class');
  });

  it('should announce the loading state as busy', async () => {
    const { container } = await render(
      <CreditBalanceBadge balance={null} isLoading={true} />
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.getAttribute('aria-label')).toBe('Loading balance');
    expect(badge.getAttribute('aria-busy')).toBe('true');
  });

  it('should name the pressable badge by its balance', async () => {
    const { container } = await render(
      <CreditBalanceBadge balance={5} isLoading={false} onClick={vi.fn()} />
    );
    const button = container.querySelector('[role="button"]');
    expect(button?.getAttribute('aria-label')).toBe('Credit balance: 5');
  });

  it('should draw the web badge’s coin, not a text glyph', async () => {
    const { container } = await render(
      <CreditBalanceBadge balance={5} isLoading={false} />
    );
    const coin = container.querySelector('[data-testid="Svg"]');
    expect(coin).not.toBeNull();
    // The path the web badge draws, on its 20-unit grid.
    expect(
      coin?.querySelector('[data-testid="Path"]')?.getAttribute('data-d')
    ).toMatch(/^M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v\.092/);
    expect(container.textContent).toBe('5');
  });

  it('should tint the coin and the count primary with credits, destructive without', async () => {
    const funded = await render(
      <CreditBalanceBadge balance={5} isLoading={false} />
    );
    const fundedBadge = funded.container.firstChild as HTMLElement;
    expect(fundedBadge.getAttribute('class')).toContain('bg-primary/10');
    expect(
      fundedBadge.querySelector('[data-testid="Svg"]')?.getAttribute('class')
    ).toBe('text-primary');
    expect(funded.getByText('5').getAttribute('class')).toContain(
      'text-primary'
    );
    funded.unmount();

    const empty = await render(
      <CreditBalanceBadge balance={0} isLoading={false} />
    );
    const emptyBadge = empty.container.firstChild as HTMLElement;
    expect(emptyBadge.getAttribute('class')).toContain('bg-destructive/10');
    expect(
      emptyBadge.querySelector('[data-testid="Svg"]')?.getAttribute('class')
    ).toBe('text-destructive');
    expect(empty.getByText('0').getAttribute('class')).toContain(
      'text-destructive'
    );
  });
});
