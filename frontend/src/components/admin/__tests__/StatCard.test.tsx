import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatCard from '../StatCard'

describe('StatCard', () => {
  it('renders title and numeric value', () => {
    render(<StatCard title="Total Users" value={42} icon="👥" />)
    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('👥')).toBeInTheDocument()
  })

  it('renders string value', () => {
    render(<StatCard title="Status" value="Active" icon="✅" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<StatCard title="Total Users" value={10} icon="👥" description="Registered accounts" />)
    expect(screen.getByText('Registered accounts')).toBeInTheDocument()
  })

  it('does not render description when omitted', () => {
    render(<StatCard title="Total Users" value={10} icon="👥" />)
    expect(screen.queryByText('Registered accounts')).not.toBeInTheDocument()
  })

  it('renders positive trend with up arrow', () => {
    render(
      <StatCard
        title="Users"
        value={100}
        icon="👥"
        trend={{ value: '+12%', positive: true }}
      />,
    )
    expect(screen.getByText(/↑/)).toBeInTheDocument()
    expect(screen.getByText(/\+12%/)).toBeInTheDocument()
  })

  it('renders negative trend with down arrow', () => {
    render(
      <StatCard
        title="Users"
        value={100}
        icon="👥"
        trend={{ value: '-5%', positive: false }}
      />,
    )
    expect(screen.getByText(/↓/)).toBeInTheDocument()
    expect(screen.getByText(/-5%/)).toBeInTheDocument()
  })

  it('does not render trend when omitted', () => {
    render(<StatCard title="Users" value={100} icon="👥" />)
    expect(screen.queryByText(/↑/)).not.toBeInTheDocument()
    expect(screen.queryByText(/↓/)).not.toBeInTheDocument()
  })
})
