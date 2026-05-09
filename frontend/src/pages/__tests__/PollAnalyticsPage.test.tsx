import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, resetAuthStore } from '../../test/renderHelpers';
import PollAnalyticsPage from '../PollAnalyticsPage';
import * as pollsApi from '../../api/polls';
import { makeUser } from '../../test/factories';
import type { Analytics } from '../../types/analytics';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../api/polls');

// Mock Recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const testUser = makeUser({ name: 'Alice' });

const mockAnalytics: Analytics = {
  totalResponses: 42,
  responsesOverTime: [
    { date: '2026-05-01', count: 10 },
    { date: '2026-05-02', count: 32 },
  ],
  questions: [
    {
      questionId: 'q1',
      questionText: 'Favourite colour?',
      type: 'SINGLE_CHOICE',
      totalAnswers: 42,
      options: [
        { optionId: 'o1', text: 'Red', count: 25, percentage: 59.5 },
        { optionId: 'o2', text: 'Blue', count: 17, percentage: 40.5 },
      ],
    },
    {
      questionId: 'q2',
      questionText: 'Any comments?',
      type: 'TEXT',
      totalAnswers: 15,
      textAnswers: ['Great poll!', 'Very interesting.'],
    },
  ],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PollAnalyticsPage', () => {
  beforeEach(() => {
    resetAuthStore();
    vi.clearAllMocks();
  });

  it('renders total response count', async () => {
    vi.mocked(pollsApi.getPollAnalytics).mockResolvedValue(mockAnalytics);

    renderWithProviders(<PollAnalyticsPage />, {
      user: testUser,
      routerProps: { initialEntries: ['/dashboard/polls/my-poll/analytics'] },
      routePattern: '/dashboard/polls/:slug/analytics',
    });

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });
    expect(screen.getByText('Total responses')).toBeInTheDocument();
  });

  it('renders chart with timeline data', async () => {
    vi.mocked(pollsApi.getPollAnalytics).mockResolvedValue(mockAnalytics);

    renderWithProviders(<PollAnalyticsPage />, {
      user: testUser,
      routerProps: { initialEntries: ['/dashboard/polls/my-poll/analytics'] },
      routePattern: '/dashboard/polls/:slug/analytics',
    });

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('renders choice question breakdown with percentages', async () => {
    vi.mocked(pollsApi.getPollAnalytics).mockResolvedValue(mockAnalytics);

    renderWithProviders(<PollAnalyticsPage />, {
      user: testUser,
      routerProps: { initialEntries: ['/dashboard/polls/my-poll/analytics'] },
      routePattern: '/dashboard/polls/:slug/analytics',
    });

    await waitFor(() => {
      expect(screen.getByText('Favourite colour?')).toBeInTheDocument();
    });
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getByText(/59\.5%/)).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
    expect(screen.getByText(/40\.5%/)).toBeInTheDocument();
  });

  it('renders text question answers list', async () => {
    vi.mocked(pollsApi.getPollAnalytics).mockResolvedValue(mockAnalytics);

    renderWithProviders(<PollAnalyticsPage />, {
      user: testUser,
      routerProps: { initialEntries: ['/dashboard/polls/my-poll/analytics'] },
      routePattern: '/dashboard/polls/:slug/analytics',
    });

    await waitFor(() => {
      expect(screen.getByText('Any comments?')).toBeInTheDocument();
    });
    expect(screen.getByText('Great poll!')).toBeInTheDocument();
    expect(screen.getByText('Very interesting.')).toBeInTheDocument();
  });

  it('CSV export button triggers download', async () => {
    vi.mocked(pollsApi.getPollAnalytics).mockResolvedValue(mockAnalytics);
    vi.mocked(pollsApi.exportPollCsv).mockResolvedValue(undefined);

    renderWithProviders(<PollAnalyticsPage />, {
      user: testUser,
      routerProps: { initialEntries: ['/dashboard/polls/my-poll/analytics'] },
      routePattern: '/dashboard/polls/:slug/analytics',
    });

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /export csv/i }));

    await waitFor(() => {
      expect(pollsApi.exportPollCsv).toHaveBeenCalledWith('my-poll');
    });
  });

  it('shows access denied on 403', async () => {
    vi.mocked(pollsApi.getPollAnalytics).mockRejectedValue({
      response: { status: 403 },
    });

    renderWithProviders(<PollAnalyticsPage />, {
      user: testUser,
      routerProps: { initialEntries: ['/dashboard/polls/my-poll/analytics'] },
      routePattern: '/dashboard/polls/:slug/analytics',
    });

    await waitFor(() => {
      expect(screen.getByText('Access denied')).toBeInTheDocument();
    });
  });
});
