import { useQuery } from '@tanstack/react-query';
import AdminHeader from '../../components/admin/AdminHeader';
import StatCard from '../../components/admin/StatCard';
import Spinner from '../../components/ui/Spinner';
import { getAdminUsers } from '../../api/admin';
import { getAdminPolls } from '../../api/admin';

export default function AdminDashboardPage() {
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ['admin', 'users', { page: 1, limit: 1 }],
    queryFn: () => getAdminUsers({ page: 1, limit: 1 }),
  });

  const {
    data: pollsData,
    isLoading: pollsLoading,
    error: pollsError,
  } = useQuery({
    queryKey: ['admin', 'polls', { page: 1, limit: 1 }],
    queryFn: () => getAdminPolls({ page: 1, limit: 1 }),
  });

  const isLoading = usersLoading || pollsLoading;
  const hasError = usersError || pollsError;

  return (
    <div>
      <AdminHeader
        title="Dashboard"
        subtitle="Overview of your polls application"
      />

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : hasError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load dashboard stats. Please try again.
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                title="Total Users"
                value={usersData?.total ?? 0}
                icon="👥"
                description="Registered accounts"
              />
              <StatCard
                title="Total Polls"
                value={pollsData?.total ?? 0}
                icon="📋"
                description="All polls in the system"
              />
              <StatCard
                title="Active Polls"
                value={
                  pollsData?.data.filter((p) => p.isActive).length ?? 0
                }
                icon="✅"
                description="Currently accepting responses"
              />
            </div>

            {/* Recent polls table */}
            <div className="mt-8">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Polls</h2>
              {pollsData && pollsData.data.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Title
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {pollsData.data.map((poll) => (
                        <tr key={poll.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-900">{poll.title}</p>
                            <p className="text-xs text-gray-500">{poll.slug}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {poll.owner.name}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                poll.visibility === 'PUBLIC'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {poll.visibility}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {poll.responseCount}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                poll.isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {poll.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
                  No polls found.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
