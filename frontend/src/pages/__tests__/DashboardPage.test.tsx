import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, resetAuthStore } from '../../test/renderHelpers';
import DashboardPage from '../DashboardPage';
import * as pollsApi from '../../api/polls';
import { makeUser, makePollSummary, makePolls, makePaginatedPolls } from '../../test/factories';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../api/polls');
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const testUser = makeUser({ name: 'Alice' });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DashboardPage', () => {
  beforeEach(() => {
    resetAuthStore();
    vi.clearAllMocks();
  });

  it('renders polls list when polls exist', async () => {
    const polls = makePolls(3);
    vi.mocked(pollsApi.getMyPolls).mockResolvedValue(makePaginatedPolls(polls));

    renderWithProviders(<DashboardPage />, { user: testUser });

    await waitFor(() => {
      expect(screen.getByText('Poll 1')).toBeInTheDocument();
    });
    expect(screen.getByText('Poll 2')).toBeInTheDocument();
    expect(screen.getByText('Poll 3')).toBeInTheDocument();
  });

  it('shows empty state when user has no polls', async () => {
    vi.mocked(pollsApi.getMyPolls).mockResolvedValue(makePaginatedPolls([]));

    renderWithProviders(<DashboardPage />, { user: testUser });

    await waitFor(() => {
      expect(screen.getByText('No polls yet')).toBeInTheDocument();
    });
  });

  it('opens create modal when Create Poll button is clicked', async () => {
    vi.mocked(pollsApi.getMyPolls).mockResolvedValue(makePaginatedPolls([]));

    renderWithProviders(<DashboardPage />, { user: testUser });

    await waitFor(() => screen.getByText('No polls yet'));

    await userEvent.click(screen.getAllByRole('button', { name: /create poll/i })[0]);

    expect(screen.getByRole('dialog', { name: /create poll/i })).toBeInTheDocument();
  });

  it('submits create form and closes modal on success', async () => {
    vi.mocked(pollsApi.getMyPolls).mockResolvedValue(makePaginatedPolls([]));
    vi.mocked(pollsApi.createPoll).mockResolvedValue({
      id: 'new-poll',
      title: 'My New Poll',
      slug: 'my-new-poll',
      description: null,
      visibility: 'PUBLIC',
      isActive: true,
      expiresAt: null,
      responseCount: 0,
      accessToken: null,
      owner: { id: testUser.id, name: testUser.name },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      questions: [],
    });

    renderWithProviders(<DashboardPage />, { user: testUser });

    await waitFor(() => screen.getByText('No polls yet'));

    // Click the header "Create Poll" button (first one in the DOM)
    await userEvent.click(screen.getAllByRole('button', { name: /create poll/i })[0]);

    // Fill in title
    const titleInput = screen.getByPlaceholderText('My poll');
    await userEvent.type(titleInput, 'My New Poll');

    // Fill in first question text
    const questionInput = screen.getByPlaceholderText('Question text');
    await userEvent.type(questionInput, 'Test question?');

    // Fill in first option
    const optionInput = screen.getByPlaceholderText('Option 1');
    await userEvent.type(optionInput, 'Option A');

    // Click the modal submit button (last "Create Poll" button in the DOM)
    const createButtons = screen.getAllByRole('button', { name: /create poll/i });
    await userEvent.click(createButtons[createButtons.length - 1]);

    await waitFor(() => {
      expect(pollsApi.createPoll).toHaveBeenCalled();
    });
  });

  it('opens edit modal pre-populated with poll data', async () => {
    const poll = makePollSummary({ title: 'Existing Poll', slug: 'existing-poll' });
    vi.mocked(pollsApi.getMyPolls).mockResolvedValue(makePaginatedPolls([poll]));

    renderWithProviders(<DashboardPage />, { user: testUser });

    await waitFor(() => screen.getByText('Existing Poll'));

    await userEvent.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByRole('dialog', { name: /edit poll/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Poll')).toBeInTheDocument();
  });

  it('confirms and executes delete', async () => {
    const poll = makePollSummary({ title: 'Poll to Delete', slug: 'poll-to-delete' });
    vi.mocked(pollsApi.getMyPolls).mockResolvedValue(makePaginatedPolls([poll]));
    vi.mocked(pollsApi.deletePoll).mockResolvedValue(undefined);

    renderWithProviders(<DashboardPage />, { user: testUser });

    await waitFor(() => screen.getByText('Poll to Delete'));

    // Click the "Delete" button on the poll list item
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));

    // Confirmation dialog appears
    expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();

    // Click the confirm "Delete" button in the dialog (the red one)
    const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
    await userEvent.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => {
      expect(pollsApi.deletePoll).toHaveBeenCalledWith('poll-to-delete');
    });
  });
});
