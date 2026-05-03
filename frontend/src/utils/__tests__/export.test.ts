import { describe, it, expect, vi, beforeEach } from 'vitest'
import { toCSV, downloadCSV, downloadJSON, exportTimestamp } from '../export'

// ─── toCSV ────────────────────────────────────────────────────────────────────

describe('toCSV', () => {
  it('returns empty string for empty array', () => {
    expect(toCSV([])).toBe('')
  })

  it('generates header row from object keys', () => {
    const rows = [{ id: '1', name: 'Alice' }]
    const csv = toCSV(rows)
    const lines = csv.split('\n')
    expect(lines[0]).toBe('id,name')
  })

  it('generates data rows', () => {
    const rows = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ]
    const csv = toCSV(rows)
    const lines = csv.split('\n')
    expect(lines[1]).toBe('1,Alice')
    expect(lines[2]).toBe('2,Bob')
  })

  it('wraps values containing commas in quotes', () => {
    const rows = [{ name: 'Smith, John' }]
    const csv = toCSV(rows)
    expect(csv).toContain('"Smith, John"')
  })

  it('escapes double quotes inside values', () => {
    const rows = [{ name: 'He said "hello"' }]
    const csv = toCSV(rows)
    expect(csv).toContain('"He said ""hello"""')
  })

  it('wraps values containing newlines in quotes', () => {
    const rows = [{ description: 'line1\nline2' }]
    const csv = toCSV(rows)
    expect(csv).toContain('"line1\nline2"')
  })

  it('converts null to empty string', () => {
    const rows = [{ id: '1', name: null }]
    const csv = toCSV(rows)
    const lines = csv.split('\n')
    expect(lines[1]).toBe('1,')
  })

  it('converts undefined to empty string', () => {
    const rows = [{ id: '1', name: undefined }]
    const csv = toCSV(rows)
    const lines = csv.split('\n')
    expect(lines[1]).toBe('1,')
  })

  it('converts boolean values to string', () => {
    const rows = [{ active: true, deleted: false }]
    const csv = toCSV(rows)
    const lines = csv.split('\n')
    expect(lines[1]).toBe('true,false')
  })

  it('converts numeric values to string', () => {
    const rows = [{ count: 42, ratio: 3.14 }]
    const csv = toCSV(rows)
    const lines = csv.split('\n')
    expect(lines[1]).toBe('42,3.14')
  })

  it('respects custom columns order', () => {
    const rows = [{ id: '1', name: 'Alice', email: 'a@b.com' }]
    const csv = toCSV(rows, ['email', 'name'])
    const lines = csv.split('\n')
    expect(lines[0]).toBe('email,name')
    expect(lines[1]).toBe('a@b.com,Alice')
  })

  it('handles multiple rows correctly', () => {
    const rows = [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
      { a: 5, b: 6 },
    ]
    const csv = toCSV(rows)
    const lines = csv.split('\n')
    expect(lines).toHaveLength(4) // header + 3 data rows
  })
})

// ─── downloadCSV ──────────────────────────────────────────────────────────────

describe('downloadCSV', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node as Node)
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node as Node)
    vi.mocked(URL.createObjectURL).mockReturnValue('blob:mock-url')
  })

  it('creates a blob URL and triggers download', () => {
    downloadCSV([{ id: '1', name: 'Alice' }], 'test-export')
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
    expect(document.body.appendChild).toHaveBeenCalledOnce()
    expect(document.body.removeChild).toHaveBeenCalledOnce()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('appends .csv extension if missing', () => {
    downloadCSV([{ id: '1' }], 'my-file')
    const appendCalls = vi.mocked(document.body.appendChild).mock.calls
    const anchor = appendCalls[0][0] as HTMLAnchorElement
    expect(anchor.download).toBe('my-file.csv')
  })

  it('does not double-append .csv extension', () => {
    downloadCSV([{ id: '1' }], 'my-file.csv')
    const appendCalls = vi.mocked(document.body.appendChild).mock.calls
    const anchor = appendCalls[0][0] as HTMLAnchorElement
    expect(anchor.download).toBe('my-file.csv')
  })
})

// ─── downloadJSON ─────────────────────────────────────────────────────────────

describe('downloadJSON', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node as Node)
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node as Node)
    vi.mocked(URL.createObjectURL).mockReturnValue('blob:mock-url')
  })

  it('triggers download with .json extension', () => {
    downloadJSON([{ id: '1' }], 'export')
    const appendCalls = vi.mocked(document.body.appendChild).mock.calls
    const anchor = appendCalls[0][0] as HTMLAnchorElement
    expect(anchor.download).toBe('export.json')
  })

  it('does not double-append .json extension', () => {
    downloadJSON([{ id: '1' }], 'export.json')
    const appendCalls = vi.mocked(document.body.appendChild).mock.calls
    const anchor = appendCalls[0][0] as HTMLAnchorElement
    expect(anchor.download).toBe('export.json')
  })

  it('serializes data as pretty-printed JSON blob', () => {
    const data = [{ id: '1', name: 'Alice' }]
    downloadJSON(data, 'export')
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob
    expect(blob.type).toBe('application/json;charset=utf-8;')
  })
})

// ─── exportTimestamp ──────────────────────────────────────────────────────────

describe('exportTimestamp', () => {
  it('returns a YYYY-MM-DD formatted string', () => {
    const ts = exportTimestamp()
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("returns today's date", () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(exportTimestamp()).toBe(today)
  })
})
