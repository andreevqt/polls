import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExportButton from '../ExportButton'
import * as exportUtils from '../../../utils/export'
import { makeUsers, makePolls } from '../../../test/factories'

vi.mock('../../../utils/export', () => ({
  downloadCSV: vi.fn(),
  downloadJSON: vi.fn(),
  exportTimestamp: vi.fn(() => '2024-01-15'),
}))

describe('ExportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Export button', () => {
    render(<ExportButton dataType="users" data={makeUsers(3)} />)
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
  })

  it('is disabled when data is empty', () => {
    render(<ExportButton dataType="users" data={[]} />)
    expect(screen.getByRole('button', { name: /export/i })).toBeDisabled()
  })

  it('is disabled when disabled prop is true', () => {
    render(<ExportButton dataType="users" data={makeUsers(3)} disabled />)
    expect(screen.getByRole('button', { name: /export/i })).toBeDisabled()
  })

  it('opens dropdown when Export button is clicked', async () => {
    render(<ExportButton dataType="users" data={makeUsers(3)} />)
    await userEvent.click(screen.getByRole('button', { name: /export/i }))
    expect(screen.getByText('Export CSV')).toBeInTheDocument()
    expect(screen.getByText('Export JSON')).toBeInTheDocument()
  })

  it('calls downloadCSV with flattened user data when Export CSV is clicked', async () => {
    const users = makeUsers(2)
    render(<ExportButton dataType="users" data={users} />)
    await userEvent.click(screen.getByRole('button', { name: /export/i }))
    await userEvent.click(screen.getByText('Export CSV'))
    expect(exportUtils.downloadCSV).toHaveBeenCalledOnce()
    const [rows, filename] = (exportUtils.downloadCSV as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(filename).toBe('users-2024-01-15')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ id: users[0].id, name: users[0].name, email: users[0].email })
  })

  it('calls downloadJSON with flattened user data when Export JSON is clicked', async () => {
    const users = makeUsers(2)
    render(<ExportButton dataType="users" data={users} />)
    await userEvent.click(screen.getByRole('button', { name: /export/i }))
    await userEvent.click(screen.getByText('Export JSON'))
    expect(exportUtils.downloadJSON).toHaveBeenCalledOnce()
    const [rows, filename] = (exportUtils.downloadJSON as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(filename).toBe('users-2024-01-15')
    expect(rows).toHaveLength(2)
  })

  it('calls downloadCSV with flattened poll data for polls dataType', async () => {
    const polls = makePolls(3)
    render(<ExportButton dataType="polls" data={polls} />)
    await userEvent.click(screen.getByRole('button', { name: /export/i }))
    await userEvent.click(screen.getByText('Export CSV'))
    expect(exportUtils.downloadCSV).toHaveBeenCalledOnce()
    const [rows, filename] = (exportUtils.downloadCSV as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(filename).toBe('polls-2024-01-15')
    expect(rows).toHaveLength(3)
    expect(rows[0]).toMatchObject({
      id: polls[0].id,
      title: polls[0].title,
      slug: polls[0].slug,
      visibility: polls[0].visibility,
    })
  })

  it('closes dropdown after export', async () => {
    render(<ExportButton dataType="users" data={makeUsers(1)} />)
    await userEvent.click(screen.getByRole('button', { name: /export/i }))
    await userEvent.click(screen.getByText('Export CSV'))
    expect(screen.queryByText('Export CSV')).not.toBeInTheDocument()
  })

  it('closes dropdown when backdrop is clicked', async () => {
    render(<ExportButton dataType="users" data={makeUsers(1)} />)
    await userEvent.click(screen.getByRole('button', { name: /export/i }))
    expect(screen.getByText('Export CSV')).toBeInTheDocument()
    // Click the fixed backdrop div
    const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement
    await userEvent.click(backdrop)
    expect(screen.queryByText('Export CSV')).not.toBeInTheDocument()
  })
})
