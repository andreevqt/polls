import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import AdminHeader from '../../components/admin/AdminHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { UserAdvancedFilters } from '../../components/admin/AdvancedFilters';
import { defaultUserFilters } from '../../components/admin/filterDefaults';
import { UserBulkActions } from '../../components/admin/BulkActions';
import ExportButton from '../../components/admin/ExportButton';
import {
  getAdminUsers,
  updateUserRole,
  bulkUpdateUserRoles,
  bulkDeleteUsers,
} from '../../api/admin';
import type { User, UserRole } from '../../types/user';
import type { UserFilters } from '../../components/admin/AdvancedFilters';

const LIMIT = 20;

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<UserFilters>(defaultUserFilters);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Build query params from filters
  const queryParams = {
    page,
    limit: LIMIT,
    search: filters.search || undefined,
    role: filters.role || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'users', queryParams],
    queryFn: () => getAdminUsers(queryParams),
  });

  // ── Single role update ──────────────────────────────────────────────────────
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => updateUserRole(id, role),
    onSuccess: (updatedUser) => {
      toast.success(`Role updated to ${updatedUser.role}`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Failed to update role'),
  });

  // ── Bulk role update ────────────────────────────────────────────────────────
  const bulkRoleMutation = useMutation({
    mutationFn: ({ ids, role }: { ids: string[]; role: UserRole }) =>
      bulkUpdateUserRoles(ids, role),
    onSuccess: (_data, { role }) => {
      toast.success(`${selectedIds.length} users updated to ${role}`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Bulk role update failed'),
  });

  // ── Bulk delete ─────────────────────────────────────────────────────────────
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteUsers(ids),
    onSuccess: () => {
      toast.success(`${selectedIds.length} users deleted`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Bulk delete failed'),
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleRoleChange(user: User, newRole: UserRole) {
    if (newRole === user.role) return;
    updateRoleMutation.mutate({ id: user.id, role: newRole });
  }

  function handleFiltersChange(next: UserFilters) {
    setFilters(next);
    setPage(1);
    setSelectedIds([]);
  }

  function handleReset() {
    setFilters(defaultUserFilters);
    setPage(1);
    setSelectedIds([]);
  }

  // ── Selection helpers ───────────────────────────────────────────────────────
  const allIds = useMemo(() => data?.data.map((u) => u.id) ?? [], [data]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

  const toggleAll = useCallback(() => {
    setSelectedIds(allSelected ? [] : allIds);
  }, [allSelected, allIds]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;
  const isBulkLoading = bulkRoleMutation.isPending || bulkDeleteMutation.isPending;

  return (
    <div>
      <AdminHeader
        title="Users"
        subtitle={data ? `${data.total} total users` : 'Manage user accounts and roles'}
      />

      <div className="p-6">
        {/* Advanced filters */}
        <UserAdvancedFilters
          filters={filters}
          onChange={handleFiltersChange}
          onReset={handleReset}
        />

        {/* Bulk actions bar */}
        <UserBulkActions
          selectedIds={selectedIds}
          onClearSelection={() => setSelectedIds([])}
          onBulkRoleChange={(role) => bulkRoleMutation.mutate({ ids: selectedIds, role })}
          onBulkDelete={() => bulkDeleteMutation.mutate(selectedIds)}
          isLoading={isBulkLoading}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load users. Please try again.
          </div>
        ) : (
          <>
            {/* Table toolbar */}
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {selectedIds.length > 0
                  ? `${selectedIds.length} selected`
                  : `${data?.total ?? 0} users`}
              </p>
              <ExportButton
                dataType="users"
                data={data?.data ?? []}
                disabled={!data || data.data.length === 0}
              />
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {/* Select-all checkbox */}
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {data?.data.map((user) => (
                    <tr
                      key={user.id}
                      className={`hover:bg-gray-50 ${selectedIds.includes(user.id) ? 'bg-indigo-50' : ''}`}
                    >
                      <td className="w-10 px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(user.id)}
                          onChange={() => toggleOne(user.id)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={user.role === 'ADMIN' ? 'info' : 'default'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                          disabled={updateRoleMutation.isPending}
                          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {data?.data.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-500">
                  {filters.search || filters.role
                    ? 'No users match the current filters.'
                    : 'No users found.'}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Page {page} of {totalPages} &mdash; {data?.total} users
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
