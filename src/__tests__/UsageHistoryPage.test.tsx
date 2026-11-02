import { describe, it, expect, vi } from 'vitest';
import { UsageHistoryPage } from '../UsageHistoryPage';
import type { UsageHistoryPageProps } from '../types';
import { render, firePress } from './test-utils';

const defaultLabels: UsageHistoryPageProps['labels'] = {
  title: 'Usage History',
  columnDate: 'Date',
  columnFilename: 'File',
  noRecords: 'No usage yet',
  loadMore: 'Load More',
};

const defaultFormatters: UsageHistoryPageProps['formatters'] = {
  formatDate: d => d,
};

const usages = [
  { id: 1, filename: 'logo.svg', created_at: '2025-01-15' },
  { id: 2, filename: null, created_at: '2025-01-14' },
] as unknown as UsageHistoryPageProps['usages'];

function base(
  overrides: Partial<UsageHistoryPageProps> = {}
): UsageHistoryPageProps {
  return {
    usages: [],
    isLoading: false,
    error: null,
    labels: defaultLabels,
    formatters: defaultFormatters,
    ...overrides,
  };
}

describe('UsageHistoryPage', () => {
  it('should show title', async () => {
    const { queryByText } = await render(<UsageHistoryPage {...base()} />);
    expect(queryByText('Usage History')).not.toBeNull();
  });

  it('should show no records message when empty', async () => {
    const { queryByText } = await render(<UsageHistoryPage {...base()} />);
    expect(queryByText('No usage yet')).not.toBeNull();
  });

  it('should show loading spinner', async () => {
    const { container } = await render(
      <UsageHistoryPage {...base({ isLoading: true })} />
    );
    expect(
      container.querySelector('[data-testid="ActivityIndicator"]')
    ).not.toBeNull();
  });

  it('should show error message', async () => {
    const { queryByText } = await render(
      <UsageHistoryPage {...base({ error: 'Failed to load' })} />
    );
    expect(queryByText('Failed to load')).not.toBeNull();
  });

  it('should render usage records with filenames', async () => {
    const { getAllByText } = await render(
      <UsageHistoryPage {...base({ usages })} />
    );
    expect(getAllByText('logo.svg')).toHaveLength(1);
  });

  it('should still render a row whose filename is null', async () => {
    // describe() falls back to '-' for a null filename; assert the row renders
    // via its (unique) date rather than the '-', which substring-matches dates.
    const { queryByText } = await render(
      <UsageHistoryPage {...base({ usages })} />
    );
    expect(queryByText('2025-01-14')).not.toBeNull();
  });

  it('should show load more button when hasMore', async () => {
    const onLoadMore = vi.fn();
    const { getByText } = await render(
      <UsageHistoryPage {...base({ usages, onLoadMore, hasMore: true })} />
    );
    firePress(getByText('Load More'));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('should not show load more when hasMore is false', async () => {
    const { queryByText } = await render(
      <UsageHistoryPage {...base({ usages, hasMore: false })} />
    );
    expect(queryByText('Load More')).toBeNull();
  });
});

describe('UsageHistoryPage: credits and reference', () => {
  it('prefers a reference over a filename', async () => {
    const { getAllByText } = await render(
      <UsageHistoryPage
        {...base({
          usages: [
            {
              id: 1,
              credits: 4,
              reference: 'generate-track — 4 track-measures',
              filename: null,
              created_at: '2026-08-16',
            },
          ] as unknown as UsageHistoryPageProps['usages'],
        })}
      />
    );
    expect(
      getAllByText('generate-track — 4 track-measures').length
    ).toBeGreaterThan(0);
  });

  it('shows a credits value only when the column label is given', async () => {
    const one = [
      { id: 1, credits: 4, reference: 'x', filename: null, created_at: 'd' },
    ] as unknown as UsageHistoryPageProps['usages'];

    const withoutLabel = await render(
      <UsageHistoryPage {...base({ usages: one })} />
    );
    expect(withoutLabel.queryByText('Credits:')).toBeNull();
    withoutLabel.unmount();

    const withLabel = await render(
      <UsageHistoryPage
        {...base({
          usages: one,
          labels: { ...defaultLabels, columnCredits: 'Credits' },
        })}
      />
    );
    expect(withLabel.getAllByText('4').length).toBeGreaterThan(0);
  });

  it('reads a missing credits count as one, never as free', async () => {
    const { getAllByText } = await render(
      <UsageHistoryPage
        {...base({
          usages: [
            { id: 1, filename: 'logo.svg', created_at: 'd' },
          ] as unknown as UsageHistoryPageProps['usages'],
          labels: { ...defaultLabels, columnCredits: 'Credits' },
        })}
      />
    );
    expect(getAllByText('1').length).toBeGreaterThan(0);
  });
});
