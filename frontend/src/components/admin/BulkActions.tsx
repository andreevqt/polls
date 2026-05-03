import { useState } from 'react';
import Button from '../ui/Button';
import type { UserRole } from '../../types/user';

// ─── Users bulk actions ───────────────────────────────────────────────────────

interface UserBulkActionsProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onBulkRoleChange: (role: UserRole) => void;
  onBulkDelete: () => void;
  isLoading?: boolean;
}

export function UserBulkActions({
  selectedIds,
  onClearSelection,
  onBulkRoleChange,
  onBulkDelete,
  isLoading = false,
}: UserBulkActionsProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const count = selectedIds.length;

  if (count === 0) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
      <span className="text-sm font-medium text-indigo-700">
        {count} user{count !== 1 ? 's' : ''} selected
      </span>

      <div className="flex flex-1 items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={isLoading}
          onClick={() => onBulkRoleChange('ADMIN')}
        >
          Set ADMIN
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={isLoading}
          onClick={() => onBulkRoleChange('USER')}
        >
          Set USER
        </Button>

        {confirmDelete ? (
          <>
            <span className="text-xs text-red-600">Delete {count} users?</span>
            <Button
              variant="danger"
              size="sm"
              isLoading={isLoading}
              onClick={() => {
                onBulkDelete();
                setConfirmDelete(false);
              }}
            >
              Confirm
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            variant="danger"
            size="sm"
            disabled={isLoading}
            onClick={() => setConfirmDelete(true)}
          >
            Delete selected
          </Button>
        )}
      </div>

      <button
        onClick={onClearSelection}
        className="ml-auto text-sm text-indigo-500 hover:text-indigo-700"
      >
        ✕ Clear
      </button>
    </div>
  );
}

// ─── Polls bulk actions ───────────────────────────────────────────────────────

interface PollBulkActionsProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onBulkDelete: () => void;
  isLoading?: boolean;
}

export function PollBulkActions({
  selectedIds,
  onClearSelection,
  onBulkDelete,
  isLoading = false,
}: PollBulkActionsProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const count = selectedIds.length;

  if (count === 0) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
      <span className="text-sm font-medium text-indigo-700">
        {count} poll{count !== 1 ? 's' : ''} selected
      </span>

      <div className="flex flex-1 items-center gap-2">
        {confirmDelete ? (
          <>
            <span className="text-xs text-red-600">Delete {count} polls?</span>
            <Button
              variant="danger"
              size="sm"
              isLoading={isLoading}
              onClick={() => {
                onBulkDelete();
                setConfirmDelete(false);
              }}
            >
              Confirm
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            variant="danger"
            size="sm"
            disabled={isLoading}
            onClick={() => setConfirmDelete(true)}
          >
            Delete selected
          </Button>
        )}
      </div>

      <button
        onClick={onClearSelection}
        className="ml-auto text-sm text-indigo-500 hover:text-indigo-700"
      >
        ✕ Clear
      </button>
    </div>
  );
}
