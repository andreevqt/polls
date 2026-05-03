import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getAdminUsers,
  updateUserRole,
  bulkUpdateUserRoles,
  deleteAdminUser,
  bulkDeleteUsers,
  getAdminPolls,
  deleteAdminPoll,
  bulkDeletePolls,
  getAdminAnalytics,
  getSystemHealth,
} from '../admin'
import { apiClient } from '../client'
import { makeUsers, makePolls, makePaginatedUsers, makePaginatedPolls } from '../../test/factories'

vi.mock('../client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockGet = vi.mocked(apiClient.get)
const mockPatch = vi.mocked(apiClient.patch)
const mockDelete = vi.mocked(apiClient.delete)

describe('Admin API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── Users ──────────────────────────────────────────────────────────────────

  describe('getAdminUsers', () => {
    it('calls GET /admin/users with query params', async () => {
      const paginated = makePaginatedUsers(makeUsers(3))
      mockGet.mockResolvedValueOnce({ data: paginated })
      const result = await getAdminUsers({ page: 1, limit: 20, search: 'alice' })
      expect(mockGet).toHaveBeenCalledWith('/admin/users', {
        params: { page: 1, limit: 20, search: 'alice' },
      })
      expect(result).toEqual(paginated)
    })

    it('calls GET /admin/users with no params when called with defaults', async () => {
      const paginated = makePaginatedUsers([])
      mockGet.mockResolvedValueOnce({ data: paginated })
      await getAdminUsers()
      expect(mockGet).toHaveBeenCalledWith('/admin/users', { params: {} })
    })
  })

  describe('updateUserRole', () => {
    it('calls PATCH /admin/users/:id with role', async () => {
      const user = makeUsers(1)[0]
      mockPatch.mockResolvedValueOnce({ data: { ...user, role: 'ADMIN' } })
      const result = await updateUserRole(user.id, 'ADMIN')
      expect(mockPatch).toHaveBeenCalledWith(`/admin/users/${user.id}`, { role: 'ADMIN' })
      expect(result.role).toBe('ADMIN')
    })
  })

  describe('bulkUpdateUserRoles', () => {
    it('calls PATCH for each user id', async () => {
      mockPatch.mockResolvedValue({ data: {} })
      await bulkUpdateUserRoles(['id-1', 'id-2', 'id-3'], 'ADMIN')
      expect(mockPatch).toHaveBeenCalledTimes(3)
      expect(mockPatch).toHaveBeenCalledWith('/admin/users/id-1', { role: 'ADMIN' })
      expect(mockPatch).toHaveBeenCalledWith('/admin/users/id-2', { role: 'ADMIN' })
      expect(mockPatch).toHaveBeenCalledWith('/admin/users/id-3', { role: 'ADMIN' })
    })

    it('resolves immediately for empty array', async () => {
      await bulkUpdateUserRoles([], 'USER')
      expect(mockPatch).not.toHaveBeenCalled()
    })
  })

  describe('deleteAdminUser', () => {
    it('calls DELETE /admin/users/:id', async () => {
      mockDelete.mockResolvedValueOnce({ data: undefined })
      await deleteAdminUser('user-123')
      expect(mockDelete).toHaveBeenCalledWith('/admin/users/user-123')
    })
  })

  describe('bulkDeleteUsers', () => {
    it('calls DELETE for each user id', async () => {
      mockDelete.mockResolvedValue({ data: undefined })
      await bulkDeleteUsers(['id-1', 'id-2'])
      expect(mockDelete).toHaveBeenCalledTimes(2)
      expect(mockDelete).toHaveBeenCalledWith('/admin/users/id-1')
      expect(mockDelete).toHaveBeenCalledWith('/admin/users/id-2')
    })
  })

  // ─── Polls ──────────────────────────────────────────────────────────────────

  describe('getAdminPolls', () => {
    it('calls GET /admin/polls with query params', async () => {
      const paginated = makePaginatedPolls(makePolls(2))
      mockGet.mockResolvedValueOnce({ data: paginated })
      const result = await getAdminPolls({ page: 2, limit: 10, visibility: 'PUBLIC' })
      expect(mockGet).toHaveBeenCalledWith('/admin/polls', {
        params: { page: 2, limit: 10, visibility: 'PUBLIC' },
      })
      expect(result).toEqual(paginated)
    })
  })

  describe('deleteAdminPoll', () => {
    it('calls DELETE /admin/polls/:id', async () => {
      mockDelete.mockResolvedValueOnce({ data: undefined })
      await deleteAdminPoll('poll-abc')
      expect(mockDelete).toHaveBeenCalledWith('/admin/polls/poll-abc')
    })
  })

  describe('bulkDeletePolls', () => {
    it('calls DELETE for each poll id', async () => {
      mockDelete.mockResolvedValue({ data: undefined })
      await bulkDeletePolls(['p-1', 'p-2', 'p-3'])
      expect(mockDelete).toHaveBeenCalledTimes(3)
    })
  })

  // ─── Analytics ──────────────────────────────────────────────────────────────

  describe('getAdminAnalytics', () => {
    it('aggregates users and polls data into analytics shape', async () => {
      const users = makeUsers(4)
      users[0] = { ...users[0], role: 'ADMIN' }
      const polls = makePolls(3)
      polls[0] = { ...polls[0], isActive: false, visibility: 'PRIVATE', responseCount: 10 }
      polls[1] = { ...polls[1], isActive: true, visibility: 'PUBLIC', responseCount: 5 }
      polls[2] = { ...polls[2], isActive: true, visibility: 'PUBLIC', responseCount: 2 }

      mockGet
        .mockResolvedValueOnce({ data: makePaginatedUsers(users, 4) })
        .mockResolvedValueOnce({ data: makePaginatedPolls(polls, 3) })

      const result = await getAdminAnalytics()

      expect(result.stats.totalUsers).toBe(4)
      expect(result.stats.totalPolls).toBe(3)
      expect(result.stats.totalResponses).toBe(17) // 10+5+2
      expect(result.pollsByVisibility.PUBLIC).toBe(2)
      expect(result.pollsByVisibility.PRIVATE).toBe(1)
      expect(result.pollsByStatus.active).toBe(2)
      expect(result.pollsByStatus.inactive).toBe(1)
      expect(result.usersByRole.ADMIN).toBe(1)
      expect(result.usersByRole.USER).toBe(3)
    })

    it('returns top 5 polls sorted by responseCount descending', async () => {
      const polls = makePolls(7).map((p, i) => ({ ...p, responseCount: i * 10 }))
      mockGet
        .mockResolvedValueOnce({ data: makePaginatedUsers([], 0) })
        .mockResolvedValueOnce({ data: makePaginatedPolls(polls, 7) })

      const result = await getAdminAnalytics()
      expect(result.topPolls).toHaveLength(5)
      expect(result.topPolls[0].responseCount).toBeGreaterThanOrEqual(
        result.topPolls[1].responseCount,
      )
    })

    it('returns 30-day time series arrays', async () => {
      mockGet
        .mockResolvedValueOnce({ data: makePaginatedUsers([], 0) })
        .mockResolvedValueOnce({ data: makePaginatedPolls([], 0) })

      const result = await getAdminAnalytics()
      expect(result.pollsOverTime).toHaveLength(30)
      expect(result.usersOverTime).toHaveLength(30)
      expect(result.responsesOverTime).toHaveLength(30)
    })
  })

  // ─── System Health ───────────────────────────────────────────────────────────

  describe('getSystemHealth', () => {
    it('returns health data from /health endpoint when available', async () => {
      const healthData = {
        status: 'ok',
        uptime: 3600,
        timestamp: '2024-01-15T10:00:00.000Z',
        database: { status: 'ok' },
        memory: { used: 100, total: 512, percentage: 20 },
        version: '1.0.0',
      }
      mockGet.mockResolvedValueOnce({ data: healthData })
      const result = await getSystemHealth()
      expect(result.status).toBe('ok')
      expect(result.version).toBe('1.0.0')
      expect(result.database.latencyMs).toBeTypeOf('number')
    })

    it('returns synthetic ok status when /health is unavailable but API responds', async () => {
      mockGet
        .mockRejectedValueOnce(new Error('404 Not Found'))
        .mockResolvedValueOnce({ data: {} })
      const result = await getSystemHealth()
      expect(result.status).toBe('ok')
      expect(result.database.status).toBe('ok')
    })

    it('returns down status when all API calls fail', async () => {
      mockGet
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
      const result = await getSystemHealth()
      expect(result.status).toBe('down')
      expect(result.database.status).toBe('error')
    })
  })
})
