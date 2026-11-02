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
});
