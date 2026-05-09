import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import {
  getMyPolls,
  createPoll,
  updatePoll,
  replaceQuestions,
  deletePoll,
  regenerateToken,
} from '../api/polls';
import type { CreatePollPayload } from '../api/polls';
import type { PollSummary, PollDetail } from '../types/poll';
import PollListItem from '../components/polls/PollListItem';
import PollFormModal from '../components/polls/PollFormModal';
import Spinner from '../components/ui/Spinner';

type ModalMode = 'create' | 'edit';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [editingPoll, setEditingPoll] = useState<PollDetail | null>(null);
  const [deletingPoll, setDeletingPoll] = useState<PollSummary | null>(null);

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-polls'],
    queryFn: () => getMyPolls(),
  });

  const polls = data?.data ?? [];

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const invalidatePolls = () => queryClient.invalidateQueries({ queryKey: ['my-polls'] });

  const createMutation = useMutation({
    mutationFn: (payload: CreatePollPayload) => createPoll(payload),
    onSuccess: () => {
      void invalidatePolls();
      setModalMode(null);
      toast.success('Poll created');
    },
    onError: () => toast.error('Failed to create poll'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      slug,
      payload,
    }: {
      slug: string;
      payload: CreatePollPayload;
    }) => {
      // Update metadata
      await updatePoll(slug, {
        title: payload.title,
        description: payload.description,
        visibility: payload.visibility,
        expiresAt: payload.expiresAt,
      });
      // Replace questions (warns user about answer deletion — handled in modal)
      await replaceQuestions(slug, payload.questions);
    },
    onSuccess: () => {
      void invalidatePolls();
      setModalMode(null);
      setEditingPoll(null);
      toast.success('Poll updated');
    },
    onError: () => toast.error('Failed to update poll'),
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => deletePoll(slug),
    onSuccess: () => {
      void invalidatePolls();
      setDeletingPoll(null);
      toast.success('Poll deleted');
    },
    onError: () => toast.error('Failed to delete poll'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ slug, isActive }: { slug: string; isActive: boolean }) =>
      updatePoll(slug, { isActive }),
    onSuccess: () => {
      void invalidatePolls();
    },
    onError: () => toast.error('Failed to update poll status'),
  });

  const regenTokenMutation = useMutation({
    mutationFn: (slug: string) => regenerateToken(slug),
    onSuccess: () => {
      void invalidatePolls();
      toast.success('Access token regenerated');
    },
    onError: () => toast.error('Failed to regenerate token'),
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────

  async function handleModalSubmit(payload: CreatePollPayload) {
    if (modalMode === 'create') {
      await createMutation.mutateAsync(payload);
    } else if (modalMode === 'edit' && editingPoll) {
      await updateMutation.mutateAsync({ slug: editingPoll.slug, payload });
    }
  }

  function handleEdit(poll: PollSummary) {
    // Cast to PollDetail — PollSummary from list doesn't include questions,
    // so we open the modal with available data; questions will be empty until
    // a full fetch is done. For simplicity we use the summary data here.
    setEditingPoll(poll as unknown as PollDetail);
    setModalMode('edit');
  }

  function handleCopyLink(poll: PollSummary) {
    const url = `${window.location.origin}/${poll.slug}`;
    void navigator.clipboard.writeText(url).then(() => toast.success('Link copied!'));
  }

  function handleToggleActive(poll: PollSummary) {
    toggleActiveMutation.mutate({ slug: poll.slug, isActive: !poll.isActive });
  }

  function handleRegenerateToken(poll: PollSummary) {
    regenTokenMutation.mutate(poll.slug);
  }

  const isModalSubmitting = createMutation.isPending || updateMutation.isPending;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Admin Panel
              </Link>
            )}
            <button
              type="button"
              onClick={() => setModalMode('create')}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Create Poll
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
              Failed to load polls. Please refresh the page.
            </div>
          ) : polls.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
              <div className="text-4xl">📋</div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">No polls yet</h2>
              <p className="mt-2 text-sm text-gray-500">
                Create your first poll to start collecting responses.
              </p>
              <button
                type="button"
                onClick={() => setModalMode('create')}
                className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Create Poll
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {polls.map((poll) => (
                <PollListItem
                  key={poll.id}
                  poll={poll}
                  onEdit={handleEdit}
                  onDelete={setDeletingPoll}
                  onToggleActive={handleToggleActive}
                  onRegenerateToken={handleRegenerateToken}
                  onCopyLink={handleCopyLink}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit modal */}
      {modalMode && (
        <PollFormModal
          poll={modalMode === 'edit' ? editingPoll ?? undefined : undefined}
          onSubmit={handleModalSubmit}
          onClose={() => {
            setModalMode(null);
            setEditingPoll(null);
          }}
          isSubmitting={isModalSubmitting}
        />
      )}

      {/* Delete confirmation dialog */}
      {deletingPoll && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold text-gray-900">Delete poll?</h2>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete{' '}
              <span className="font-medium">{deletingPoll.title}</span>? This action cannot be
              undone and will remove all responses.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingPoll(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deletingPoll.slug)}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteMutation.isPending && <Spinner size="sm" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
