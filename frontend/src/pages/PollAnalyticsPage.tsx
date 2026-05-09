import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPollAnalytics, exportPollCsv } from '../api/polls';
import AnalyticsChart from '../components/polls/AnalyticsChart';
import QuestionAnalyticsCard from '../components/polls/QuestionAnalyticsCard';
import Spinner from '../components/ui/Spinner';

export default function PollAnalyticsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [isExporting, setIsExporting] = useState(false);

  const {
    data: analytics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['analytics', slug],
    queryFn: () => getPollAnalytics(slug!),
    enabled: !!slug,
    staleTime: 30_000, // 30s stale time for perceived performance (SC-004)
  });

  async function handleExport() {
    if (!slug) return;
    setIsExporting(true);
    try {
      await exportPollCsv(slug);
    } finally {
      setIsExporting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  const httpStatus = (error as { response?: { status?: number } })?.response?.status;

  if (error) {
    if (httpStatus === 403) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="text-4xl">🔒</div>
            <h1 className="mt-4 text-xl font-semibold text-gray-900">Access denied</h1>
            <p className="mt-2 text-sm text-gray-600">
              You are not the owner of this poll.
            </p>
            <Link
              to="/dashboard"
              className="mt-4 inline-block text-sm text-indigo-600 hover:underline"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="text-4xl">❌</div>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Poll not found</h1>
          <p className="mt-2 text-sm text-gray-600">
            This poll does not exist or has been removed.
          </p>
          <Link
            to="/dashboard"
            className="mt-4 inline-block text-sm text-indigo-600 hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/dashboard"
              className="text-xs text-indigo-600 hover:underline"
            >
              ← Back to dashboard
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Poll Analytics</h1>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting ? (
              <>
                <Spinner size="sm" />
                Exporting…
              </>
            ) : (
              'Export CSV'
            )}
          </button>
        </div>

        {/* Total responses */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total responses</p>
          <p className="mt-1 text-4xl font-bold text-gray-900">{analytics.totalResponses}</p>
        </div>

        {/* Timeline chart */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Responses over time</h2>
          <AnalyticsChart data={analytics.responsesOverTime} />
        </div>

        {/* Per-question breakdown */}
        {analytics.questions.length > 0 && (
          <div className="mt-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Question breakdown</h2>
            {analytics.questions.map((q) => (
              <QuestionAnalyticsCard key={q.questionId} question={q} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
