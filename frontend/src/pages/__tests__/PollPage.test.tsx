import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, resetAuthStore } from '../../test/renderHelpers';
import PollPage from '../PollPage';
import * as pollsApi from '../../api/polls';
import type { PollDetail } from '../../types/poll';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../api/polls');

const mockPoll: PollDetail = {
  id: 'poll-1',
  title: 'Favourite Colour',
  slug: 'favourite-colour',
  description: 'Pick your favourite',
  visibility: 'PUBLIC',
  isActive: true,
  expiresAt: null,
  responseCount: 0,
  accessToken: null,
  owner: { id: 'user-1', name: 'Alice' },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  questions: [
    {
      id: 'q1',
      text: 'What is your favourite colour?',
      type: 'SINGLE_CHOICE',
      orderIndex: 0,
      isRequired: true,
      options: [
        { id: 'o1', text: 'Red', orderIndex: 0 },
        { id: 'o2', text: 'Blue', orderIndex: 1 },
      ],
    },
    {
      id: 'q2',
      text: 'Any comments?',
      type: 'TEXT',
      orderIndex: 1,
      isRequired: false,
      options: [],
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderPollPage(slug = 'favourite-colour') {
  return renderWithProviders(<PollPage />, {
    routerProps: { initialEntries: [`/${slug}`] },
    routePattern: '/:slug',
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PollPage', () => {
  function clearRespondedCookies() {
    document.cookie.split(';').forEach((c) => {
      const name = c.trim().split('=')[0];
      if (name.startsWith('responded_')) {
        document.cookie = `${name}=; max-age=0; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    });
  }

  beforeEach(() => {
    resetAuthStore();
    vi.clearAllMocks();
    clearRespondedCookies();
  });

  afterEach(() => {
    clearRespondedCookies();
  });

  it('renders poll questions after loading', async () => {
    vi.mocked(pollsApi.getPollBySlug).mockResolvedValue(mockPoll);

    renderPollPage();

    await waitFor(() => {
      expect(screen.getByText('Favourite Colour')).toBeInTheDocument();
    });

    expect(screen.getByText('What is your favourite colour?')).toBeInTheDocument();
    expect(screen.getByText('Any comments?')).toBeInTheDocument();
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
  });

  it('shows already-responded state when cookie is present', () => {
    document.cookie = 'responded_favourite-colour=true; path=/';

    renderPollPage();

    expect(screen.getByText('Already responded')).toBeInTheDocument();
    expect(screen.queryByText('Submit response')).not.toBeInTheDocument();
  });

  it('shows poll unavailable state on 410', async () => {
    vi.mocked(pollsApi.getPollBySlug).mockRejectedValue({
      response: { status: 410 },
    });

    renderPollPage();

    await waitFor(() => {
      expect(screen.getByText('Poll unavailable')).toBeInTheDocument();
    });
  });

  it('shows access denied state on 403', async () => {
    vi.mocked(pollsApi.getPollBySlug).mockRejectedValue({
      response: { status: 403 },
    });

    renderPollPage();

    await waitFor(() => {
      expect(screen.getByText('Access denied')).toBeInTheDocument();
    });
  });

  it('shows thank-you state after successful submit', async () => {
    // Use a unique slug so the cookie set on success doesn't bleed into other tests
    const uniqueSlug = 'thank-you-unique-slug';
    const uniquePoll = { ...mockPoll, slug: uniqueSlug };
    vi.mocked(pollsApi.getPollBySlug).mockResolvedValue(uniquePoll);
    vi.mocked(pollsApi.submitResponse).mockResolvedValue({
      id: 'resp-1',
      submittedAt: '2026-01-01T00:00:00.000Z',
    });

    renderPollPage(uniqueSlug);

    await waitFor(() => {
      expect(screen.getByText('Favourite Colour')).toBeInTheDocument();
    });

    // Select a radio option
    const redOption = screen.getByLabelText('Red') as HTMLInputElement;
    await userEvent.click(redOption);

    // Submit
    await userEvent.click(screen.getByRole('button', { name: /submit response/i }));

    await waitFor(() => {
      expect(screen.getByText('Thank you!')).toBeInTheDocument();
    });
  });

  it('shows duplicate error on 409', async () => {
    vi.mocked(pollsApi.getPollBySlug).mockResolvedValue(mockPoll);
    vi.mocked(pollsApi.submitResponse).mockRejectedValue({
      response: { status: 409 },
    });

    renderPollPage();

    await waitFor(() => {
      expect(screen.getByText('Favourite Colour')).toBeInTheDocument();
    });

    const redOption = screen.getByLabelText('Red') as HTMLInputElement;
    await userEvent.click(redOption);

    await userEvent.click(screen.getByRole('button', { name: /submit response/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/you have already submitted a response/i),
      ).toBeInTheDocument();
    });
    // Form should still be visible (not replaced)
    expect(screen.getByText('Favourite Colour')).toBeInTheDocument();
  });
});
