import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserAdvancedFilters, PollAdvancedFilters } from '../AdvancedFilters'
import { defaultUserFilters, defaultPollFilters } from '../filterDefaults'
import type { UserFilters, PollFilters } from '../AdvancedFilters'

// ─── UserAdvancedFilters ──────────────────────────────────────────────────────

describe('UserAdvancedFilters', () => {
  const onChange = vi.fn()
  const onReset = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderUserFilters(filters: UserFilters = defaultUserFilters) {
    return render(
      <UserAdvancedFilters filters={filters} onChange={onChange} onReset={onReset} />,
    )
  }

  it('renders search input', () => {
    renderUserFilters()
    expect(screen.getByPlaceholderText(/search by name or email/i)).toBeInTheDocument()
  })

  it('calls onChange when search input changes', async () => {
    renderUserFilters()
    const input = screen.getByPlaceholderText(/search by name or email/i)
    await userEvent.type(input, 'a')
    // onChange is called for each character typed
    expect(onChange).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'a' }))
  })

  it('shows Filters button', () => {
    renderUserFilters()
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument()
  })

  it('expands filter panel when Filters button is clicked', async () => {
    renderUserFilters()
    await userEvent.click(screen.getByRole('button', { name: /filters/i }))
    // The expanded panel has 3 selects: Role, Sort by, Order
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThanOrEqual(3)
  })

  it('does not show Reset button when filters are default', () => {
    renderUserFilters()
    expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument()
  })

  it('shows Reset button when search is active', () => {
    renderUserFilters({ ...defaultUserFilters, search: 'alice' })
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
  })

  it('calls onReset when Reset button is clicked', async () => {
    renderUserFilters({ ...defaultUserFilters, search: 'alice' })
    await userEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('calls onChange with role when role filter changes', async () => {
    renderUserFilters()
    await userEvent.click(screen.getByRole('button', { name: /filters/i }))
    // First combobox in the expanded panel is the Role select
    const selects = screen.getAllByRole('combobox')
    await userEvent.selectOptions(selects[0], 'ADMIN')
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'ADMIN' }),
    )
  })

  it('shows active filter indicator when filters differ from defaults', () => {
    renderUserFilters({ ...defaultUserFilters, role: 'ADMIN' })
    // The "!" badge should be visible
    expect(screen.getByText('!')).toBeInTheDocument()
  })

  it('calls onChange with sortBy when sort select changes', async () => {
    renderUserFilters()
    await userEvent.click(screen.getByRole('button', { name: /filters/i }))
    const selects = screen.getAllByRole('combobox')
    // Second select is Sort by
    await userEvent.selectOptions(selects[1], 'name')
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'name' }),
    )
  })

  it('calls onChange with sortOrder when order select changes', async () => {
    renderUserFilters()
    await userEvent.click(screen.getByRole('button', { name: /filters/i }))
    const selects = screen.getAllByRole('combobox')
    // Third select is Order
    await userEvent.selectOptions(selects[2], 'asc')
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ sortOrder: 'asc' }),
    )
  })
})

// ─── PollAdvancedFilters ──────────────────────────────────────────────────────

describe('PollAdvancedFilters', () => {
  const onChange = vi.fn()
  const onReset = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderPollFilters(filters: PollFilters = defaultPollFilters) {
    return render(
      <PollAdvancedFilters filters={filters} onChange={onChange} onReset={onReset} />,
    )
  }

  it('renders search input for polls', () => {
    renderPollFilters()
    expect(screen.getByPlaceholderText(/search polls by title/i)).toBeInTheDocument()
  })

  it('calls onChange when search input changes', async () => {
    renderPollFilters()
    const input = screen.getByPlaceholderText(/search polls by title/i)
    await userEvent.type(input, 's')
    expect(onChange).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ search: 's' }))
  })

  it('expands filter panel with 4 selects (visibility, status, sort, order)', async () => {
    renderPollFilters()
    await userEvent.click(screen.getByRole('button', { name: /filters/i }))
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThanOrEqual(4)
  })

  it('calls onChange with visibility when visibility filter changes', async () => {
    renderPollFilters()
    await userEvent.click(screen.getByRole('button', { name: /filters/i }))
    const selects = screen.getAllByRole('combobox')
    // First select is Visibility
    await userEvent.selectOptions(selects[0], 'PUBLIC')
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ visibility: 'PUBLIC' }),
    )
  })

  it('calls onChange with isActive=true when status is set to Active', async () => {
    renderPollFilters()
    await userEvent.click(screen.getByRole('button', { name: /filters/i }))
    const selects = screen.getAllByRole('combobox')
    // Second select is Status
    await userEvent.selectOptions(selects[1], 'true')
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: true }),
    )
  })

  it('calls onChange with isActive=false when status is set to Inactive', async () => {
    renderPollFilters()
    await userEvent.click(screen.getByRole('button', { name: /filters/i }))
    const selects = screen.getAllByRole('combobox')
    await userEvent.selectOptions(selects[1], 'false')
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    )
  })

  it('shows Reset button when visibility filter is active', () => {
    renderPollFilters({ ...defaultPollFilters, visibility: 'PRIVATE' })
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
  })

  it('calls onReset when Reset is clicked', async () => {
    renderPollFilters({ ...defaultPollFilters, search: 'test' })
    await userEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('shows active filter indicator when filters differ from defaults', () => {
    renderPollFilters({ ...defaultPollFilters, visibility: 'PUBLIC' })
    expect(screen.getByText('!')).toBeInTheDocument()
  })

  it('renders label text for filter sections when expanded', async () => {
    renderPollFilters()
    await userEvent.click(screen.getByRole('button', { name: /filters/i }))
    // Check label text is visible (even without for= association)
    const panel = screen.getByRole('button', { name: /filters/i }).closest('div')!
      .parentElement!
    expect(within(panel).getByText('Visibility')).toBeInTheDocument()
    expect(within(panel).getByText('Status')).toBeInTheDocument()
    expect(within(panel).getByText('Sort by')).toBeInTheDocument()
    expect(within(panel).getByText('Order')).toBeInTheDocument()
  })
})
