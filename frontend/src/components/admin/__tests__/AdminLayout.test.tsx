import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AdminLayout from '../AdminLayout'
import { useAuthStore } from '../../../store/authStore'
import { makeAdminUser } from '../../../test/factories'

// Mock the logout API call
vi.mock('../../../api/auth', () => ({
  logout: vi.fn().mockResolvedValue(undefined),
}))

function renderLayout() {
  // Seed auth store with an admin user
  const store = useAuthStore.getState()
  store.setAuth(makeAdminUser(), 'token')
  store.setInitialized()

  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <AdminLayout />
    </MemoryRouter>,
  )
}

describe('AdminLayout', () => {
  it('renders the sidebar', () => {
    renderLayout()
    // 'Polls' appears as brand name AND as nav link — use getAllByText
    expect(screen.getAllByText('Polls').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('renders all navigation items', () => {
    renderLayout()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    // 'Polls' appears as brand + nav link
    expect(screen.getAllByText('Polls').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument()
  })

  it('renders user info in sidebar', () => {
    renderLayout()
    expect(screen.getByText('Admin User')).toBeInTheDocument()
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
  })

  it('renders sign out button', () => {
    renderLayout()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })
})
