import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserBulkActions, PollBulkActions } from '../BulkActions'

// ─── UserBulkActions ──────────────────────────────────────────────────────────

describe('UserBulkActions', () => {
  const defaultProps = {
    selectedIds: ['id-1', 'id-2'],
    onClearSelection: vi.fn(),
    onBulkRoleChange: vi.fn(),
    onBulkDelete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when no ids are selected', () => {
    const { container } = render(
      <UserBulkActions {...defaultProps} selectedIds={[]} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows count of selected users', () => {
    render(<UserBulkActions {...defaultProps} />)
    expect(screen.getByText('2 users selected')).toBeInTheDocument()
  })

  it('shows singular "user" for single selection', () => {
    render(<UserBulkActions {...defaultProps} selectedIds={['id-1']} />)
    expect(screen.getByText('1 user selected')).toBeInTheDocument()
  })

  it('calls onBulkRoleChange with ADMIN when Set ADMIN is clicked', async () => {
    render(<UserBulkActions {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: 'Set ADMIN' }))
    expect(defaultProps.onBulkRoleChange).toHaveBeenCalledWith('ADMIN')
  })

  it('calls onBulkRoleChange with USER when Set USER is clicked', async () => {
    render(<UserBulkActions {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: 'Set USER' }))
    expect(defaultProps.onBulkRoleChange).toHaveBeenCalledWith('USER')
  })

  it('shows confirmation dialog before deleting', async () => {
    render(<UserBulkActions {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete selected' }))
    expect(screen.getByText(/Delete 2 users\?/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('calls onBulkDelete after confirming deletion', async () => {
    render(<UserBulkActions {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete selected' }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(defaultProps.onBulkDelete).toHaveBeenCalledOnce()
  })

  it('cancels deletion and hides confirmation', async () => {
    render(<UserBulkActions {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete selected' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(defaultProps.onBulkDelete).not.toHaveBeenCalled()
    expect(screen.queryByText(/Delete 2 users\?/)).not.toBeInTheDocument()
  })

  it('calls onClearSelection when ✕ Clear is clicked', async () => {
    render(<UserBulkActions {...defaultProps} />)
    await userEvent.click(screen.getByText(/✕ Clear/))
    expect(defaultProps.onClearSelection).toHaveBeenCalledOnce()
  })

  it('disables action buttons when isLoading is true', () => {
    render(<UserBulkActions {...defaultProps} isLoading />)
    expect(screen.getByRole('button', { name: 'Set ADMIN' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Set USER' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Delete selected' })).toBeDisabled()
  })
})

// ─── PollBulkActions ──────────────────────────────────────────────────────────

describe('PollBulkActions', () => {
  const defaultProps = {
    selectedIds: ['poll-1', 'poll-2', 'poll-3'],
    onClearSelection: vi.fn(),
    onBulkDelete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when no ids are selected', () => {
    const { container } = render(
      <PollBulkActions {...defaultProps} selectedIds={[]} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows count of selected polls', () => {
    render(<PollBulkActions {...defaultProps} />)
    expect(screen.getByText('3 polls selected')).toBeInTheDocument()
  })

  it('shows singular "poll" for single selection', () => {
    render(<PollBulkActions {...defaultProps} selectedIds={['poll-1']} />)
    expect(screen.getByText('1 poll selected')).toBeInTheDocument()
  })

  it('shows confirmation before deleting', async () => {
    render(<PollBulkActions {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete selected' }))
    expect(screen.getByText(/Delete 3 polls\?/)).toBeInTheDocument()
  })

  it('calls onBulkDelete after confirming', async () => {
    render(<PollBulkActions {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete selected' }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(defaultProps.onBulkDelete).toHaveBeenCalledOnce()
  })

  it('calls onClearSelection when ✕ Clear is clicked', async () => {
    render(<PollBulkActions {...defaultProps} />)
    await userEvent.click(screen.getByText(/✕ Clear/))
    expect(defaultProps.onClearSelection).toHaveBeenCalledOnce()
  })
})
