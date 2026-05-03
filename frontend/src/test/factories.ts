/**
 * Test data factories — create realistic test objects with sensible defaults.
 */
import type { User, UserRole } from '../types/user'
import type { PollSummary, PollVisibility } from '../types/poll'

let idCounter = 1
function nextId(): string {
  return `test-id-${idCounter++}`
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: nextId(),
    name: 'Test User',
    email: 'test@example.com',
    role: 'USER' as UserRole,
    createdAt: '2024-01-15T10:00:00.000Z',
    ...overrides,
  }
}

export function makeAdminUser(overrides: Partial<User> = {}): User {
  return makeUser({ name: 'Admin User', email: 'admin@example.com', role: 'ADMIN', ...overrides })
}

export function makePollSummary(overrides: Partial<PollSummary> = {}): PollSummary {
  const id = nextId()
  return {
    id,
    title: 'Test Poll',
    slug: `test-poll-${id}`,
    description: 'A test poll description',
    visibility: 'PUBLIC' as PollVisibility,
    isActive: true,
    expiresAt: null,
    responseCount: 0,
    owner: { id: nextId(), name: 'Poll Owner' },
    createdAt: '2024-01-15T10:00:00.000Z',
    ...overrides,
  }
}

export function makeUsers(count: number, overrides: Partial<User> = {}): User[] {
  return Array.from({ length: count }, (_, i) =>
    makeUser({ name: `User ${i + 1}`, email: `user${i + 1}@example.com`, ...overrides }),
  )
}

export function makePolls(count: number, overrides: Partial<PollSummary> = {}): PollSummary[] {
  return Array.from({ length: count }, (_, i) =>
    makePollSummary({ title: `Poll ${i + 1}`, ...overrides }),
  )
}

export function makePaginatedUsers(
  users: User[],
  total?: number,
  page = 1,
  limit = 20,
) {
  return { data: users, total: total ?? users.length, page, limit }
}

export function makePaginatedPolls(
  polls: PollSummary[],
  total?: number,
  page = 1,
  limit = 20,
) {
  return { data: polls, total: total ?? polls.length, page, limit }
}
