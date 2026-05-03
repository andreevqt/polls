import { useQuery } from '@tanstack/react-query';
import AdminHeader from '../../components/admin/AdminHeader';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import { getSystemHealth } from '../../api/admin';

function StatusDot({ status }: { status: 'ok' | 'degraded' | 'down' | 'error' }) {
  const colors = {
    ok: 'bg-emerald-500',
    degraded: 'bg-amber-500',
    down: 'bg-red-500',
    error: 'bg-red-500',
  };
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${colors[status]} ring-2 ring-white`}
    />
  );
}

function StatusBadge({ status }: { status: 'ok' | 'degraded' | 'down' | 'error' }) {
  const styles = {
    ok: 'bg-emerald-100 text-emerald-700',
    degraded: 'bg-amber-100 text-amber-700',
    down: 'bg-red-100 text-red-700',
    error: 'bg-red-100 text-red-700',
  };
  const labels = { ok: 'Operational', degraded: 'Degraded', down: 'Down', error: 'Error' };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      <StatusDot status={status} />
      {labels[status]}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function formatUptime(seconds: number): string {
  if (seconds === 0) return 'N/A';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

function MemoryBar({ percentage }: { percentage: number }) {
  const color =
    percentage > 90
      ? 'bg-red-500'
      : percentage > 70
        ? 'bg-amber-500'
        : 'bg-emerald-500';
  return (
    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );
}

export default function AdminSystemPage() {
  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['admin', 'system-health'],
    queryFn: getSystemHealth,
    refetchInterval: 30_000, // auto-refresh every 30 s
    staleTime: 15_000,
  });

  const lastChecked = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString()
    : '—';

  return (
    <div>
      <AdminHeader title="System" subtitle="Health and status monitoring" />

      <div className="p-6">
        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Last checked: <span className="font-medium text-gray-700">{lastChecked}</span>
            <span className="ml-2 text-xs text-gray-400">(auto-refreshes every 30 s)</span>
          </p>
          <Button
            variant="secondary"
            size="sm"
            isLoading={isFetching}
            onClick={() => refetch()}
          >
            ↻ Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to reach the backend. The server may be down.
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* ── Overall status ─────────────────────────────────────── */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-800">Overall Status</h2>
                <StatusBadge status={data.status} />
              </div>
              <InfoRow label="API Version" value={data.version} />
              <InfoRow label="Uptime" value={formatUptime(data.uptime)} />
              <InfoRow
                label="Timestamp"
                value={new Date(data.timestamp).toLocaleString()}
              />
            </div>

            {/* ── Database ───────────────────────────────────────────── */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-800">Database</h2>
                <StatusBadge status={data.database.status} />
              </div>
              <InfoRow
                label="Connection"
                value={data.database.status === 'ok' ? 'Connected' : 'Disconnected'}
              />
              <InfoRow
                label="Latency"
                value={
                  data.database.latencyMs !== undefined
                    ? `${data.database.latencyMs} ms`
                    : 'N/A'
                }
              />
            </div>

            {/* ── Memory ─────────────────────────────────────────────── */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-800">Memory Usage</h2>
              {data.memory.total > 0 ? (
                <>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {(data.memory.used / 1024 / 1024).toFixed(1)} MB used
                    </span>
                    <span className="font-medium text-gray-700">
                      {data.memory.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <MemoryBar percentage={data.memory.percentage} />
                  <p className="mt-1 text-xs text-gray-400">
                    Total: {(data.memory.total / 1024 / 1024).toFixed(1)} MB
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400">Memory data not available.</p>
              )}
            </div>

            {/* ── Endpoints quick-check ──────────────────────────────── */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-800">API Endpoints</h2>
              {[
                { name: 'Auth', path: '/api/v1/auth' },
                { name: 'Polls', path: '/api/v1/polls' },
                { name: 'Admin', path: '/api/v1/admin' },
              ].map((ep) => (
                <div
                  key={ep.path}
                  className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{ep.name}</p>
                    <p className="text-xs text-gray-400">{ep.path}</p>
                  </div>
                  <StatusBadge status={data.status === 'down' ? 'down' : 'ok'} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
