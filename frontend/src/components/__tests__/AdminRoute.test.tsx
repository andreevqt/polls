import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AdminRoute from '../AdminRoute'
import { useAuthStore } from '../../store/authStore'
import { makeAdminUser, makeUser } from '../../test/factories'

function renderAdminRoute(initialPath = '/admin') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/" element={<div>Home Page</div>} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<div>Admin Dashboard</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, isInitialized: false })
  })

  it('shows spinner while auth is not initialized', () => {
    useAuthStore.setState({ user: null, accessToken: null, isInitialized: false })
    renderAdminRoute()
    // Spinner should be rendered (no redirect yet)
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument()
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
  })

  it('redirects to /login when user is not authenticated', () => {
    useAuthStore.setState({ user: null, accessToken: null, isInitialized: true })
    renderAdminRoute()
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument()
  })

  it('redirects to / when user is authenticated but not ADMIN', () => {
    useAuthStore.setState({
      user: makeUser({ role: 'USER' }),
      accessToken: 'token',
      isInitialized: true,
    })
    renderAdminRoute()
    expect(screen.getByText('Home Page')).toBeInTheDocument()
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument()
  })

  it('renders admin content when user is ADMIN', () => {
    useAuthStore.setState({
      user: makeAdminUser(),
      accessToken: 'token',
      isInitialized: true,
    })
    renderAdminRoute()
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
  })
})
