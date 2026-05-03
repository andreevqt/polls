import { useState } from 'react';
import Button from '../ui/Button';
import { downloadCSV, downloadJSON, exportTimestamp } from '../../utils/export';
import type { User } from '../../types/user';
import type { PollSummary } from '../../types/poll';

type ExportFormat = 'csv' | 'json';
type ExportDataType = 'users' | 'polls';

interface ExportButtonProps {
  dataType: ExportDataType;
  data: User[] | PollSummary[];
  disabled?: boolean;
}

function flattenUsers(users: User[]) {
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
  }));
}

function flattenPolls(polls: PollSummary[]) {
  return polls.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    visibility: p.visibility,
    isActive: p.isActive,
    responseCount: p.responseCount,
    ownerName: p.owner.name,
    ownerId: p.owner.id,
    createdAt: p.createdAt,
    expiresAt: p.expiresAt ?? '',
  }));
}

export default function ExportButton({ dataType, data, disabled = false }: ExportButtonProps) {
  const [open, setOpen] = useState(false);

  function handleExport(format: ExportFormat) {
    const timestamp = exportTimestamp();
    const filename = `${dataType}-${timestamp}`;

    if (dataType === 'users') {
      const rows = flattenUsers(data as User[]);
      if (format === 'csv') downloadCSV(rows, filename);
      else downloadJSON(rows, filename);
    } else {
      const rows = flattenPolls(data as PollSummary[]);
      if (format === 'csv') downloadCSV(rows, filename);
      else downloadJSON(rows, filename);
    }

    setOpen(false);
  }

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="md"
        disabled={disabled || data.length === 0}
        onClick={() => setOpen((v) => !v)}
      >
        <span>⬇</span>
        Export
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <button
              onClick={() => handleExport('csv')}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <span>📄</span>
              Export CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <span>📋</span>
              Export JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}
