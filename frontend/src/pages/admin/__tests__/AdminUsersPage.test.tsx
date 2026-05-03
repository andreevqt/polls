import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/renderHelpers'
import AdminUsersPage from '../AdminUsersPage'
import * as adminApi from '../../../api/admin'
import {
  makeAdminUser,
  makeUsers,
  makePaginatedUsers,
} from '../../../test/factories'

vi.mock('../../../api/admin', () => ({
  getAdminUsers: vi.fn(),
  updateUserRole: vi.fn(),
  bulkUpdateUserRoles: vi.fn(),
  bulkDeleteUsers: vi.fn(),
}))

// Suppress react-hot-toast in tests
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function setupWithUsers(count = 3, total?: number) {
    const users = makeUsers(count)
    vi.mocked(adminApi.getAdminUsers).mockResolvedValue(
      makePaginatedUsers(users, total ?? count),
    )
    return { users }
  }

  it('shows spinner while loading', () => {
    vi.mocked(adminApi.getAdminUsers).mockReturnValue(new Promise(() => {}))
    renderWithProviders(<AdminUsersPage />, { user: makeAdminUser() })
    // Spinner is present (no table yet)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows error message when API fails', async () => {
    vi.mocked(adminApi.getAdminUsers).mockRejectedValue(new Error('Network error'))
    renderWithProviders(<AdminUsersPage />, { user: makeAdminUser() })
    await waitFor(() => {
      expect(screen.getByText(/failed to load users/i)).toBeInTheDocument()
    })
  })

  it('renders user table with correct columns', async () => {
    setupWithUsers(2)
    renderWithProviders(<AdminUsersPage />, { user: makeAdminUser() })
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(screen.getByText('User')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
    expect(screen.getByText('Joined')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('renders user names and emails', async () => {
    const users = makeUsers(2)
    users[0] = { ...users[0], name: 'Alice Smith', email: 'alice@example.com' }
    users[1] = { ...users[1], name: 'Bob Jones', email: 'bob@example.com' }
    vi.mocked(adminApi.getAdminUsers).mockResolvedValue(makePaginatedUsers(users))
    renderWithProviders(<AdminUsersPage />, { user: makeAdminUser() })
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
  })

  it('shows total user count in header subtitle', async () => {
    setupWithUsers(3, 42)
    renderWithProviders(<AdminUsersPage />, { user: makeAdminUser() })
    await waitFor(() => {
      expect(screen.getByText('42 total users')).toBeInTheDocument()
    })
  })

  it('selects a user when checkbox is clicked', async () => {
    const { users } = setupWithUsers(2)
    renderWithProviders(<AdminUsersPage />, { user: makeAdminUser() })
    await waitFor(() => screen.getByRole('table'))

    const checkboxes = screen.getAllByRole('checkbox')
    // checkboxes[0] is select-all, checkboxes[1] is first user
    await userEvent.click(checkboxes[1])
    expect(screen.getByText(`1 selected`)).toBeInTheDocument()
    // BulkActions bar should appear
    expect(screen.getByText(`1 user selected`)).toBeInTheDocument()
    expect(users[0]).toBeDefined()
  })

  it('selects all users when select-all checkbox is clicked', async () => {
    setupWithUsers(3)
    renderWithProviders(<AdminUsersPage />, { user: makeAdminUser() })
    await waitFor(() => screen.getByRole('table'))

    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0]) // select-all
    expect(screen.getByText('3 users selected')).toBeInTheDocument()
  })

  it('deselects all when select-all is clicked again', async () => {
    setupWithUsers(2)
    renderWithProviders(<AdminUsersPage />, { user: makeAdminUser() })
    await waitFor(() => screen.getByRole('table'))

    const checkboxes = screen.getAllByRole('checkbox')
    await userEvent.click(checkboxes[0]) // select all
    await userEvent.click(checkboxes[0]) // deselect all
    expect(screen.queryByText(/users selected/)).not.toBeInTheDocument()
  })

  it('shows empty state when no users match filters', async () => {
    vi.mocked(adminApi.getAdminUsers).mockResolvedValue(makePaginatedUsers([], 0))
    renderWithProviders(<AdminUsersPage />, { user: makeAdminUser() })
    await waitFor(() => {
      expect(screen.getByText('No users found.')).toBeInTheDocument()
    })
  })

  it('shows pagination when total exceeds page limit', async () => {
    setupWithUsers(20, 50)
    renderWithProviders(<AdminUsersPage />, { user: makeAdminUser() })
    await waitFor(() => {
      expect(screen.getByText(/page 1 of/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
  })

  it('does not show pagination when all users fit on one page', async () => {
    setupWithUsers(5, 5)
    renderWithProviders(<AdminUsersPage />, { user: makeAdminUser() })
    await waitFor(() => screen.getByRole('table'))
    expect(screen.queryByText(/page 1 of/i)).not.toBeInTheDocument()
  })

  it('renders search filter input', async () => {
    setupWithUsers(1)
    renderWithProviders(<AdminUsersPage />, { user: makeAdminUser() })
    await waitFor(() => screen.getByRole('table'))
    expect(screen.getByPlaceholderText(/search by name or email/i)).toBeInTheDocument()
  })

  it('renders export button', async () => {
    setupWithUsers(2)
    renderWithProviders(<AdminUsersPage />, { user: makeAdminUser() })
    await waitFor(() => screen.getByRole('table'))
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
  })

  it('calls updateUserRole when role select changes', async () => {
    const users = makeUsers(1)
    users[0] = { ...users[0], role: 'USER' }
    vi.mocked(adminApi.getAdminUsers).mockResolvedValue(makePaginatedUsers(users))
    vi.mocked(adminApi.updateUserRole).mockResolvedValue({ ...users[0], role: 'ADMIN' })

    renderWithProviders(<AdminUsersPage />, { user: makeAdminUser() })
    await waitFor(() => screen.getByRole('table'))

    const roleSelect = within(screen.getByRole('table')).getAllByRole('combobox')[0]
    await userEvent.selectOptions(roleSelect, 'ADMIN')
    expect(adminApi.updateUserRole).toHaveBeenCalledWith(users[0].id, 'ADMIN')
  })
})
