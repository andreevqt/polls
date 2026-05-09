import { Link } from 'react-router-dom';
import type { PollSummary } from '../../types/poll';

interface PollListItemProps {
  poll: PollSummary;
  onEdit: (poll: PollSummary) => void;
  onDelete: (poll: PollSummary) => void;
  onToggleActive: (poll: PollSummary) => void;
  onRegenerateToken?: (poll: PollSummary) => void;
  onCopyLink: (poll: PollSummary) => void;
}

export default function PollListItem({
  poll,
  onEdit,
  onDelete,
  onToggleActive,
  onRegenerateToken,
  onCopyLink,
}: PollListItemProps) {
  const pollUrl = `${window.location.origin}/${poll.slug}`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: title + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-gray-900">{poll.title}</h3>
            <span
              className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                poll.visibility === 'PUBLIC'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {poll.visibility}
            </span>
            <span
              className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                poll.isActive ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'
              }`}
            >
              {poll.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <p className="mt-1 text-xs text-gray-500">
            /{poll.slug} · {poll.responseCount} response{poll.responseCount !== 1 ? 's' : ''}
            {poll.expiresAt && (
              <> · Expires {new Date(poll.expiresAt).toLocaleDateString()}</>
            )}
          </p>
        </div>

        {/* Right: actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle active */}
          <button
            type="button"
            onClick={() => onToggleActive(poll)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            aria-label={poll.isActive ? 'Deactivate poll' : 'Activate poll'}
          >
            {poll.isActive ? 'Deactivate' : 'Activate'}
          </button>

          {/* Copy link */}
          <button
            type="button"
            onClick={() => onCopyLink(poll)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            aria-label="Copy poll link"
            title={pollUrl}
          >
            Copy link
          </button>

          {/* View analytics — T020 */}
          <Link
            to={`/dashboard/polls/${poll.slug}/analytics`}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Analytics
          </Link>

          {/* Regenerate token (private polls only) */}
          {poll.visibility === 'PRIVATE' && onRegenerateToken && (
            <button
              type="button"
              onClick={() => onRegenerateToken(poll)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              aria-label="Regenerate access token"
            >
              Regen token
            </button>
          )}

          {/* Edit */}
          <button
            type="button"
            onClick={() => onEdit(poll)}
            className="rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
          >
            Edit
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(poll)}
            className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
