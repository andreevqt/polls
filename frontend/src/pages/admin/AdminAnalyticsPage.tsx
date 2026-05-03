import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import AdminHeader from '../../components/admin/AdminHeader';
import StatCard from '../../components/admin/StatCard';
import Spinner from '../../components/ui/Spinner';
import { getAdminAnalytics } from '../../api/admin';

const COLORS = {
  indigo: '#6366f1',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  sky: '#0ea5e9',
  violet: '#8b5cf6',
};

// Shorten date labels for the x-axis (MM/DD)
function shortDate(dateStr: string) {
  const [, month, day] = dateStr.split('-');
  return `${month}/${day}`;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-base font-semibold text-gray-800">{children}</h2>;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">{title}</h3>
      {children}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: getAdminAnalytics,
    staleTime: 60_000,
  });

  return (
    <div>
      <AdminHeader title="Analytics" subtitle="System-wide statistics and trends" />

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load analytics. Please try again.
          </div>
        ) : data ? (
          <>
            {/* ── KPI cards ─────────────────────────────────────────────── */}
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <StatCard
                title="Total Users"
                value={data.stats.totalUsers}
                icon="👥"
                description="Registered accounts"
              />
              <StatCard
                title="Total Polls"
                value={data.stats.totalPolls}
                icon="📋"
                description="All polls in the system"
              />
              <StatCard
                title="Total Responses"
                value={data.stats.totalResponses}
                icon="💬"
                description="Across all polls"
              />
            </div>

            {/* ── Time-series charts ────────────────────────────────────── */}
            <SectionTitle>Activity Over the Last 30 Days</SectionTitle>
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartCard title="New Polls">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data.pollsOverTime}>
                    <defs>
                      <linearGradient id="pollGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.indigo} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={COLORS.indigo} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={shortDate}
                      tick={{ fontSize: 11 }}
                      interval={4}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Polls"
                      stroke={COLORS.indigo}
                      strokeWidth={2}
                      fill="url(#pollGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="New Users">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data.usersOverTime}>
                    <defs>
                      <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={shortDate}
                      tick={{ fontSize: 11 }}
                      interval={4}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Users"
                      stroke={COLORS.emerald}
                      strokeWidth={2}
                      fill="url(#userGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* ── Distribution charts ───────────────────────────────────── */}
            <SectionTitle>Poll Distribution</SectionTitle>
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Visibility pie */}
              <ChartCard title="By Visibility">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Public', value: data.pollsByVisibility.PUBLIC },
                        { name: 'Private', value: data.pollsByVisibility.PRIVATE },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {[COLORS.indigo, COLORS.sky].map((color, i) => (
                        <Cell key={i} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Status pie */}
              <ChartCard title="By Status">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Active', value: data.pollsByStatus.active },
                        { name: 'Inactive', value: data.pollsByStatus.inactive },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {[COLORS.emerald, COLORS.rose].map((color, i) => (
                        <Cell key={i} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Users by role pie */}
              <ChartCard title="Users by Role">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'USER', value: data.usersByRole.USER },
                        { name: 'ADMIN', value: data.usersByRole.ADMIN },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {[COLORS.indigo, COLORS.amber].map((color, i) => (
                        <Cell key={i} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* ── Top polls bar chart ───────────────────────────────────── */}
            <SectionTitle>Top Polls by Responses</SectionTitle>
            <div className="mb-8">
              <ChartCard title="Most Responded Polls">
                {data.topPolls.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-400">No poll data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={data.topPolls}
                      layout="vertical"
                      margin={{ left: 16, right: 24 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0f0f0"
                        horizontal={false}
                      />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="title"
                        width={160}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: string) =>
                          v.length > 22 ? `${v.slice(0, 22)}…` : v
                        }
                      />
                      <Tooltip />
                      <Bar
                        dataKey="responseCount"
                        name="Responses"
                        fill={COLORS.violet}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
