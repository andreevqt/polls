import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderHelpers'
import AdminPollsPage from '../AdminPollsPage'
import * as adminApi from '../../../api/admin'
import {
  makeAdminUser,
  makePolls,
  makePaginatedPolls,
} from '../../../test/factories'

vi.mock('../../../api/admin', () => ({
  getAdminPolls: vi.fn(),
  deleteAdminPoll: vi.fn(),
  bulkDeletePolls: vi.fn(),
}))

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('AdminPollsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function setupWithPolls(count = 3, total?: number) {
    const polls = makePolls(count)
    vi.mocked(adminApi.getAdminPolls).mockResolvedValue(
      makePaginatedPolls(polls, total ?? count),
    )
    return { polls }
  }

  it('shows spinner while loading', () => {
    vi.mocked(adminApi.getAdminPolls).mockReturnValue(new Promise(() => {}))
    renderWithProviders(<AdminPollsPage />, { user: makeAdminUser() })
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows error message when API fails', async () => {
    vi.mocked(adminApi.getAdminPolls).mockRejectedValue(new Error('Server error'))
    renderWithProviders(<AdminPollsPage />, { user: makeAdminUser() })
    await waitFor(() => {
      expect(screen.getByText(/failed to load polls/i)).toBeInTheDocument()
    })
  })

  it('renders polls table with correct columns', async () => {
    setupWithPolls(2)
    renderWithProviders(<AdminPollsPage />, { user: makeAdminUser() })
    await waitFor(() => screen.getByRole('table'))
    expect(screen.getByText('Poll')).toBeInTheDocument()
    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('Visibility')).toBeInTheDocument()
    expect(screen.getByText('Responses')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Created')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('renders poll titles and slugs', async () => {
    const polls = makePolls(1)
    polls[0] = { ...polls[0], title: 'Customer Survey', slug: 'customer-survey' }
    vi.mocked(adminApi.getAdminPolls).mockResolvedValue(makePaginatedPolls(polls))
    renderWithProviders(<AdminPollsPage />, { user: makeAdminUser() })
    await waitFor(() => {
      expect(screen.getByText('Customer Survey')).toBeInTheDocument()
    })
    expect(screen.getByText('customer-survey')).toBeInTheDocument()
  })

  it('shows total poll count in header subtitle', async () => {
    setupWithPolls(3, 99)
    renderWithProviders(<AdminPollsPage />, { user: makeAdminUser() })
    await waitFor(() => {
      expect(screen.getByText('99 total polls')).toBeInTheDocument()
    })
  })

  it('shows empty state when no polls', async () => {
    vi.mocked(adminApi.getAdminPolls).mockResolvedValue(makePaginatedPolls([], 0))
    renderWithProviders(<AdminPollsPage />, { user: makeAdminUser() })
    await waitFor(() => {
      expect(screen.getByText('No polls found.')).toBeInTheDocument()
    })
  })

  it('shows confirmation dialog before deleting a poll', async () => {
    setupWithPolls(1)
    renderWithProviders(<AdminPollsPage />, { user: makeAdminUser() })
    await waitFor(() => screen.getByRole('table'))

    // Click the Delete button for the first poll
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await userEvent.click(deleteButtons[0])

    expect(screen.getByText('Confirm?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('calls deleteAdminPoll after confirming deletion', async () => {
    const { polls } = setupWithPolls(1)
    vi.mocked(adminApi.deleteAdminPoll).mockResolvedValue(undefined)
    renderWithProviders(<AdminPollsPage />, { user: makeAdminUser() })
    await waitFor(() => screen.getByRole('table'))

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await userEvent.click(deleteButtons[0])
    // Confirm
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    expect(adminApi.deleteAdminPoll).toHaveBeenCalledWith(polls[0].id)
  })

  it('cancels deletion when Cancel is clicked', async () => {
    setupWithPolls(1)
    renderWithProviders(<AdminPollsPage />, { user: makeAdminUser() })
    await waitFor(() => screen.getByRole('table'))

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await userEvent.click(deleteButtons[0])
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(adminApi.deleteAdminPoll).not.toHaveBeenCalled()
    expect(screen.queryByText('Confirm?')).not.toBeInTheDocument()
  })

  it('selects a poll when checkbox is clicked', async () => {
    setupWithPolls(2)
    renderWithProviders(<AdminPollsPage />, { user: makeAdminUser() })
    await waitFor(() => screen.getByRole('table'))

    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[1]) // first poll checkbox
    expect(screen.getByText('1 selected')).toBeInTheDocument()
    expect(screen.getByText('1 poll selected')).toBeInTheDocument()
  })

  it('selects all polls when select-all checkbox is clicked', async () => {
    setupWithPolls(3)
    renderWithProviders(<AdminPollsPage />, { user: makeAdminUser() })
    await waitFor(() => screen.getByRole('table'))

    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0]) // select-all
    expect(screen.getByText('3 polls selected')).toBeInTheDocument()
  })

  it('shows pagination when total exceeds page limit', async () => {
    setupWithPolls(20, 60)
    renderWithProviders(<AdminPollsPage />, { user: makeAdminUser() })
    await waitFor(() => {
      expect(screen.getByText(/page 1 of/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('renders search filter input', async () => {
    setupWithPolls(1)
    renderWithProviders(<AdminPollsPage />, { user: makeAdminUser() })
    await waitFor(() => screen.getByRole('table'))
    expect(screen.getByPlaceholderText(/search polls by title/i)).toBeInTheDocument()
  })

  it('renders export button', async () => {
    setupWithPolls(2)
    renderWithProviders(<AdminPollsPage />, { user: makeAdminUser() })
    await waitFor(() => screen.getByRole('table'))
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
  })

  it('renders Active/Inactive badges correctly', async () => {
    const polls = makePolls(2)
    polls[0] = { ...polls[0], isActive: true }
    polls[1] = { ...polls[1], isActive: false }
    vi.mocked(adminApi.getAdminPolls).mockResolvedValue(makePaginatedPolls(polls))
    renderWithProviders(<AdminPollsPage />, { user: makeAdminUser() })
    await waitFor(() => screen.getByRole('table'))
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })
})
