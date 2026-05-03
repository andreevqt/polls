import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AdminHeader from '../AdminHeader'

function renderHeader(props: Parameters<typeof AdminHeader>[0]) {
  return render(
    <MemoryRouter>
      <AdminHeader {...props} />
    </MemoryRouter>,
  )
}

describe('AdminHeader', () => {
  it('renders title', () => {
    renderHeader({ title: 'Dashboard' })
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    renderHeader({ title: 'Users', subtitle: '42 total users' })
    expect(screen.getByText('42 total users')).toBeInTheDocument()
  })

  it('does not render subtitle when omitted', () => {
    renderHeader({ title: 'Users' })
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument()
  })

  it('renders a Link button when action.to is provided', () => {
    renderHeader({ title: 'Polls', action: { label: 'New Poll', to: '/polls/new' } })
    const link = screen.getByRole('link', { name: 'New Poll' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/polls/new')
  })

  it('renders a button when action.onClick is provided', async () => {
    const onClick = vi.fn()
    renderHeader({ title: 'Polls', action: { label: 'Refresh', onClick } })
    const btn = screen.getByRole('button', { name: 'Refresh' })
    expect(btn).toBeInTheDocument()
    await userEvent.click(btn)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not render action area when action is omitted', () => {
    renderHeader({ title: 'Dashboard' })
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
