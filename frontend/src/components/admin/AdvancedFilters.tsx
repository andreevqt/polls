import { useState } from 'react';
import Button from '../ui/Button';
import type { UserRole } from '../../types/user';
import type { PollVisibility } from '../../types/poll';

// ─── Shared types ─────────────────────────────────────────────────────────────

type SortOrder = 'asc' | 'desc';

// ─── User filters ─────────────────────────────────────────────────────────────

export interface UserFilters {
  search: string;
  role: UserRole | '';
  sortBy: 'createdAt' | 'name' | 'email';
  sortOrder: SortOrder;
}

interface UserAdvancedFiltersProps {
  filters: UserFilters;
  onChange: (filters: UserFilters) => void;
  onReset: () => void;
}

export function UserAdvancedFilters({ filters, onChange, onReset }: UserAdvancedFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const hasActiveFilters =
    filters.search !== '' ||
    filters.role !== '' ||
    filters.sortBy !== 'createdAt' ||
    filters.sortOrder !== 'desc';

  function update(partial: Partial<UserFilters>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Search row — always visible */}
      <div className="flex items-center gap-2 p-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search by name or email…"
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-4 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <Button
          variant="ghost"
          size="md"
          onClick={() => setExpanded((v) => !v)}
          className={hasActiveFilters ? 'text-indigo-600' : ''}
        >
          <span>⚙</span>
          Filters
          {hasActiveFilters && (
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
              !
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="md" onClick={onReset}>
            Reset
          </Button>
        )}
      </div>

      {/* Expanded filter panel */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Role filter */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Role</label>
              <select
                value={filters.role}
                onChange={(e) => update({ role: e.target.value as UserRole | '' })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All roles</option>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            {/* Sort by */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Sort by</label>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  update({ sortBy: e.target.value as UserFilters['sortBy'] })
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="createdAt">Date joined</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
              </select>
            </div>

            {/* Sort order */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => update({ sortOrder: e.target.value as SortOrder })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Poll filters ─────────────────────────────────────────────────────────────

export interface PollFilters {
  search: string;
  visibility: PollVisibility | '';
  isActive: boolean | '';
  sortBy: 'createdAt' | 'title' | 'responseCount';
  sortOrder: SortOrder;
}

interface PollAdvancedFiltersProps {
  filters: PollFilters;
  onChange: (filters: PollFilters) => void;
  onReset: () => void;
}

export function PollAdvancedFilters({ filters, onChange, onReset }: PollAdvancedFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const hasActiveFilters =
    filters.search !== '' ||
    filters.visibility !== '' ||
    filters.isActive !== '' ||
    filters.sortBy !== 'createdAt' ||
    filters.sortOrder !== 'desc';

  function update(partial: Partial<PollFilters>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Search row — always visible */}
      <div className="flex items-center gap-2 p-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search polls by title…"
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-4 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <Button
          variant="ghost"
          size="md"
          onClick={() => setExpanded((v) => !v)}
          className={hasActiveFilters ? 'text-indigo-600' : ''}
        >
          <span>⚙</span>
          Filters
          {hasActiveFilters && (
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
              !
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="md" onClick={onReset}>
            Reset
          </Button>
        )}
      </div>

      {/* Expanded filter panel */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {/* Visibility */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Visibility</label>
              <select
                value={filters.visibility}
                onChange={(e) => update({ visibility: e.target.value as PollVisibility | '' })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All</option>
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
              <select
                value={filters.isActive === '' ? '' : String(filters.isActive)}
                onChange={(e) => {
                  const v = e.target.value;
                  update({ isActive: v === '' ? '' : v === 'true' });
                }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {/* Sort by */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Sort by</label>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  update({ sortBy: e.target.value as PollFilters['sortBy'] })
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="createdAt">Date created</option>
                <option value="title">Title</option>
                <option value="responseCount">Responses</option>
              </select>
            </div>

            {/* Sort order */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => update({ sortOrder: e.target.value as SortOrder })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
