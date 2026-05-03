import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import AdminHeader from '../../components/admin/AdminHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { PollAdvancedFilters } from '../../components/admin/AdvancedFilters';
import { defaultPollFilters } from '../../components/admin/filterDefaults';
import { PollBulkActions } from '../../components/admin/BulkActions';
import ExportButton from '../../components/admin/ExportButton';
import { getAdminPolls, deleteAdminPoll, bulkDeletePolls } from '../../api/admin';
import type { PollFilters } from '../../components/admin/AdvancedFilters';

const LIMIT = 20;

export default function AdminPollsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<PollFilters>(defaultPollFilters);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Build query params from filters
  const queryParams = {
    page,
    limit: LIMIT,
    search: filters.search || undefined,
    visibility: filters.visibility || undefined,
    isActive: filters.isActive === '' ? undefined : filters.isActive,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'polls', queryParams],
    queryFn: () => getAdminPolls(queryParams),
  });

  // ── Single delete ───────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminPoll(id),
    onSuccess: () => {
      toast.success('Poll deleted');
      setConfirmDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'polls'] });
    },
    onError: () => toast.error('Failed to delete poll'),
  });

  // ── Bulk delete ─────────────────────────────────────────────────────────────
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDeletePolls(ids),
    onSuccess: () => {
      toast.success(`${selectedIds.length} polls deleted`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['admin', 'polls'] });
    },
    onError: () => toast.error('Bulk delete failed'),
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleFiltersChange(next: PollFilters) {
    setFilters(next);
    setPage(1);
    setSelectedIds([]);
  }

  function handleReset() {
    setFilters(defaultPollFilters);
    setPage(1);
    setSelectedIds([]);
  }

  // ── Selection helpers ───────────────────────────────────────────────────────
  const allIds = useMemo(() => data?.data.map((p) => p.id) ?? [], [data]);
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

  return (
    <div>
      <AdminHeader
        title="Polls"
        subtitle={data ? `${data.total} total polls` : 'Manage all polls in the system'}
      />

      <div className="p-6">
        {/* Advanced filters */}
        <PollAdvancedFilters
          filters={filters}
          onChange={handleFiltersChange}
          onReset={handleReset}
        />

        {/* Bulk actions bar */}
        <PollBulkActions
          selectedIds={selectedIds}
          onClearSelection={() => setSelectedIds([])}
          onBulkDelete={() => bulkDeleteMutation.mutate(selectedIds)}
          isLoading={bulkDeleteMutation.isPending}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load polls. Please try again.
          </div>
        ) : (
          <>
            {/* Table toolbar */}
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {selectedIds.length > 0
                  ? `${selectedIds.length} selected`
                  : `${data?.total ?? 0} polls`}
              </p>
              <ExportButton
                dataType="polls"
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
                      Poll
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Visibility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Responses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {data?.data.map((poll) => (
                    <tr
                      key={poll.id}
                      className={`hover:bg-gray-50 ${selectedIds.includes(poll.id) ? 'bg-indigo-50' : ''}`}
                    >
                      <td className="w-10 px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(poll.id)}
                          onChange={() => toggleOne(poll.id)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{poll.title}</p>
                        <p className="text-xs text-gray-500">{poll.slug}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{poll.owner.name}</td>
                      <td className="px-6 py-4">
                        <Badge variant={poll.visibility === 'PUBLIC' ? 'success' : 'default'}>
                          {poll.visibility}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{poll.responseCount}</td>
                      <td className="px-6 py-4">
                        <Badge variant={poll.isActive ? 'success' : 'danger'}>
                          {poll.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(poll.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {confirmDeleteId === poll.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-gray-500">Confirm?</span>
                            <Button
                              variant="danger"
                              size="sm"
                              isLoading={deleteMutation.isPending}
                              onClick={() => deleteMutation.mutate(poll.id)}
                            >
                              Delete
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setConfirmDeleteId(poll.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {data?.data.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-500">
                  {filters.search || filters.visibility || filters.isActive !== ''
                    ? 'No polls match the current filters.'
                    : 'No polls found.'}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Page {page} of {totalPages} &mdash; {data?.total} polls
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
