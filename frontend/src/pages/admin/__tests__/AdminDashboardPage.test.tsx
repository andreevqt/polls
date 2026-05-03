import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../../test/renderHelpers'
import AdminDashboardPage from '../AdminDashboardPage'
import * as adminApi from '../../../api/admin'
import { makeAdminUser, makePolls, makePaginatedUsers, makePaginatedPolls } from '../../../test/factories'

vi.mock('../../../api/admin', () => ({
  getAdminUsers: vi.fn(),
  getAdminPolls: vi.fn(),
}))

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows spinner while loading', () => {
    vi.mocked(adminApi.getAdminUsers).mockReturnValue(new Promise(() => {}))
    vi.mocked(adminApi.getAdminPolls).mockReturnValue(new Promise(() => {}))
    renderWithProviders(<AdminDashboardPage />, { user: makeAdminUser() })
    expect(document.querySelector('svg, [role="status"]') ?? screen.queryByText(/loading/i)).toBeTruthy()
  })

  it('shows error message when API fails', async () => {
    vi.mocked(adminApi.getAdminUsers).mockRejectedValue(new Error('Server error'))
    vi.mocked(adminApi.getAdminPolls).mockRejectedValue(new Error('Server error'))
    renderWithProviders(<AdminDashboardPage />, { user: makeAdminUser() })
    await waitFor(() => {
      expect(screen.getByText(/failed to load dashboard stats/i)).toBeInTheDocument()
    })
  })

  it('renders stat cards with correct values', async () => {
    vi.mocked(adminApi.getAdminUsers).mockResolvedValue(makePaginatedUsers([], 42))
    const polls = makePolls(5)
    polls[0] = { ...polls[0], isActive: false }
    polls[1] = { ...polls[1], isActive: false }
    vi.mocked(adminApi.getAdminPolls).mockResolvedValue(makePaginatedPolls(polls, 5))

    renderWithProviders(<AdminDashboardPage />, { user: makeAdminUser() })

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument()
    })

    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Total Polls')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Active Polls')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument() // 5 - 2 inactive
  })

  it('renders recent polls table', async () => {
    const polls = makePolls(3)
    polls[0] = { ...polls[0], title: 'My First Poll', owner: { id: 'o1', name: 'Alice' } }
    vi.mocked(adminApi.getAdminUsers).mockResolvedValue(makePaginatedUsers([], 10))
    vi.mocked(adminApi.getAdminPolls).mockResolvedValue(makePaginatedPolls(polls, 3))

    renderWithProviders(<AdminDashboardPage />, { user: makeAdminUser() })

    await waitFor(() => {
      expect(screen.getByText('Recent Polls')).toBeInTheDocument()
    })
    expect(screen.getByText('My First Poll')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('shows empty state when no polls', async () => {
    vi.mocked(adminApi.getAdminUsers).mockResolvedValue(makePaginatedUsers([], 0))
    vi.mocked(adminApi.getAdminPolls).mockResolvedValue(makePaginatedPolls([], 0))

    renderWithProviders(<AdminDashboardPage />, { user: makeAdminUser() })

    await waitFor(() => {
      expect(screen.getByText('No polls found.')).toBeInTheDocument()
    })
  })

  it('renders Dashboard title', async () => {
    vi.mocked(adminApi.getAdminUsers).mockResolvedValue(makePaginatedUsers([], 0))
    vi.mocked(adminApi.getAdminPolls).mockResolvedValue(makePaginatedPolls([], 0))

    renderWithProviders(<AdminDashboardPage />, { user: makeAdminUser() })

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })
})
