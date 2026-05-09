import { apiClient } from './client';
import type { PaginatedUsers, User, UserRole } from '../types/user';
import type { PaginatedPolls } from '../types/poll';
import type { AdminStats } from '../types/analytics';

export interface AdminUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole | '';
  sortBy?: 'createdAt' | 'name' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminPollsQuery {
  page?: number;
  limit?: number;
  search?: string;
  visibility?: 'PUBLIC' | 'PRIVATE' | '';
  isActive?: boolean | '';
  sortBy?: 'createdAt' | 'title' | 'responseCount';
  sortOrder?: 'asc' | 'desc';
}

export interface SystemHealth {
  status: 'ok' | 'degraded' | 'down';
  uptime: number;
  timestamp: string;
  database: {
    status: 'ok' | 'error';
    latencyMs?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  version: string;
}

export interface AdminAnalyticsData {
  stats: AdminStats;
  pollsOverTime: Array<{ date: string; count: number }>;
  usersOverTime: Array<{ date: string; count: number }>;
  responsesOverTime: Array<{ date: string; count: number }>;
  topPolls: Array<{ id: string; title: string; slug: string; responseCount: number }>;
  pollsByVisibility: { PUBLIC: number; PRIVATE: number };
  pollsByStatus: { active: number; inactive: number };
  usersByRole: { USER: number; ADMIN: number };
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getAdminUsers(query: AdminUsersQuery = {}): Promise<PaginatedUsers> {
  const { data } = await apiClient.get<PaginatedUsers>('/admin/users', { params: query });
  return data;
}

export async function updateUserRole(id: string, role: UserRole): Promise<User> {
  const { data } = await apiClient.patch<User>(`/admin/users/${id}`, { role });
  return data;
}

export async function bulkUpdateUserRoles(ids: string[], role: UserRole): Promise<void> {
  await Promise.all(ids.map((id) => apiClient.patch(`/admin/users/${id}`, { role })));
}

export async function deleteAdminUser(id: string): Promise<void> {
  await apiClient.delete(`/admin/users/${id}`);
}

export async function bulkDeleteUsers(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => apiClient.delete(`/admin/users/${id}`)));
}

// ─── Polls ────────────────────────────────────────────────────────────────────

export async function getAdminPolls(query: AdminPollsQuery = {}): Promise<PaginatedPolls> {
  const { data } = await apiClient.get<PaginatedPolls>('/admin/polls', { params: query });
  return data;
}

export async function deleteAdminPoll(id: string): Promise<void> {
  await apiClient.delete(`/admin/polls/${id}`);
}

export async function bulkDeletePolls(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => apiClient.delete(`/admin/polls/${id}`)));
}

// ─── Analytics ────────────────────────────────────────────────────────────────

/**
 * Fetch admin-level analytics by aggregating users + polls data.
 * The backend does not expose a dedicated /admin/analytics endpoint,
 * so we derive the data from the existing paginated endpoints.
 */
export async function getAdminAnalytics(): Promise<AdminAnalyticsData> {
  const [usersRes, pollsRes] = await Promise.all([
    apiClient.get<PaginatedUsers>('/admin/users', { params: { page: 1, limit: 100 } }),
    apiClient.get<PaginatedPolls>('/admin/polls', { params: { page: 1, limit: 100 } }),
  ]);

  const users = usersRes.data.data;
  const polls = pollsRes.data.data;
  const totalUsers = usersRes.data.total;
  const totalPolls = pollsRes.data.total;

  // Aggregate responses count
  const totalResponses = polls.reduce((sum, p) => sum + p.responseCount, 0);

  // Polls by visibility
  const pollsByVisibility = polls.reduce(
    (acc, p) => {
      acc[p.visibility] = (acc[p.visibility] ?? 0) + 1;
      return acc;
    },
    { PUBLIC: 0, PRIVATE: 0 } as { PUBLIC: number; PRIVATE: number },
  );

  // Polls by status
  const pollsByStatus = polls.reduce(
    (acc, p) => {
      if (p.isActive) acc.active += 1;
      else acc.inactive += 1;
      return acc;
    },
    { active: 0, inactive: 0 },
  );

  // Users by role
  const usersByRole = users.reduce(
    (acc, u) => {
      acc[u.role] = (acc[u.role] ?? 0) + 1;
      return acc;
    },
    { USER: 0, ADMIN: 0 } as { USER: number; ADMIN: number },
  );

  // Top polls by response count
  const topPolls = [...polls]
    .sort((a, b) => b.responseCount - a.responseCount)
    .slice(0, 5)
    .map((p) => ({ id: p.id, title: p.title, slug: p.slug, responseCount: p.responseCount }));

  // Build time-series data from createdAt fields (last 30 days)
  const now = new Date();
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });

  const countByDay = (items: Array<{ createdAt: string }>) => {
    const map: Record<string, number> = {};
    items.forEach((item) => {
      const day = item.createdAt.slice(0, 10);
      map[day] = (map[day] ?? 0) + 1;
    });
    return days.map((date) => ({ date, count: map[date] ?? 0 }));
  };

  return {
    stats: { totalUsers, totalPolls, activePolls: 0, totalResponses },
    pollsOverTime: countByDay(polls),
    usersOverTime: countByDay(users),
    responsesOverTime: days.map((date) => ({ date, count: 0 })), // placeholder
    topPolls,
    pollsByVisibility,
    pollsByStatus,
    usersByRole,
  };
}

// ─── System Health ────────────────────────────────────────────────────────────

/**
 * Fetch system health from the /health endpoint (if available).
 * Falls back to a synthetic response derived from a lightweight API call.
 */
export async function getSystemHealth(): Promise<SystemHealth> {
  try {
    const start = performance.now();
    const { data } = await apiClient.get<SystemHealth>('/health');
    const latencyMs = Math.round(performance.now() - start);
    return { ...data, database: { ...data.database, latencyMs } };
  } catch {
    // If /health doesn't exist, probe the API and return a synthetic status
    const start = performance.now();
    try {
      await apiClient.get('/admin/users', { params: { page: 1, limit: 1 } });
      const latencyMs = Math.round(performance.now() - start);
      return {
        status: 'ok',
        uptime: 0,
        timestamp: new Date().toISOString(),
        database: { status: 'ok', latencyMs },
        memory: { used: 0, total: 0, percentage: 0 },
        version: 'unknown',
      };
    } catch {
      return {
        status: 'down',
        uptime: 0,
        timestamp: new Date().toISOString(),
        database: { status: 'error' },
        memory: { used: 0, total: 0, percentage: 0 },
        version: 'unknown',
      };
    }
  }
}
