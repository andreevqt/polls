import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AdminSidebar from '../AdminSidebar'
import { useAuthStore } from '../../../store/authStore'
import { makeAdminUser } from '../../../test/factories'
import * as authApi from '../../../api/auth'

vi.mock('../../../api/auth', () => ({
  logout: vi.fn().mockResolvedValue(undefined),
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('AdminSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const store = useAuthStore.getState()
    store.setAuth(makeAdminUser({ name: 'Jane Admin', email: 'jane@example.com' }), 'token')
    store.setInitialized()
  })

  function renderSidebar() {
    return render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminSidebar />
      </MemoryRouter>,
    )
  }

  it('renders the Polls brand and Admin badge', () => {
    renderSidebar()
    // 'Polls' appears as brand name AND as nav link — use getAllByText
    expect(screen.getAllByText('Polls').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('renders all navigation links', () => {
    renderSidebar()
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /users/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /polls/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /analytics/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /system/i })).toBeInTheDocument()
  })

  it('renders user name and email', () => {
    renderSidebar()
    expect(screen.getByText('Jane Admin')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('renders user avatar with first letter of name', () => {
    renderSidebar()
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('calls logout API and navigates to /login on sign out', async () => {
    renderSidebar()
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }))
    expect(authApi.logout).toHaveBeenCalledOnce()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('still navigates to /login even if logout API throws', async () => {
    vi.mocked(authApi.logout).mockRejectedValueOnce(new Error('Network error'))
    renderSidebar()
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('clears auth store on sign out', async () => {
    renderSidebar()
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }))
    const { user, accessToken } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(accessToken).toBeNull()
  })
})
