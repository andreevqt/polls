import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getPollBySlug, submitResponse } from '../api/polls';
import type { Question, AnswerPayload } from '../types/poll';
import QuestionRenderer from '../components/polls/QuestionRenderer';
import Spinner from '../components/ui/Spinner';

// ─── Respondent fingerprint ───────────────────────────────────────────────────

function getOrCreateFingerprint(): string {
  const key = 'respondent_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

function hasRespondedCookie(slug: string): boolean {
  return document.cookie.split(';').some((c) => c.trim().startsWith(`responded_${slug}=`));
}

function setRespondedCookie(slug: string): void {
  const oneYear = 365 * 24 * 60 * 60;
  document.cookie = `responded_${slug}=true; path=/; max-age=${oneYear}; SameSite=Lax`;
}

// ─── Form validation ──────────────────────────────────────────────────────────

type FormValues = Record<string, string | string[]>;

function validateAnswers(questions: Question[], values: FormValues): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const q of questions) {
    if (!q.isRequired) continue;
    const val = values[q.id];
    if (q.type === 'MULTIPLE_CHOICE') {
      if (!Array.isArray(val) || val.length === 0) {
        errs[q.id] = 'Please select at least one option';
      }
    } else {
      if (!val || (typeof val === 'string' && val.trim() === '')) {
        errs[q.id] = 'This question is required';
      }
    }
  }
  return errs;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PollPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const accessToken = searchParams.get('accessToken') ?? undefined;

  // Read cookie synchronously on first render — no effect needed (SC-002)
  const [alreadyResponded] = useState(() => (slug ? hasRespondedCookie(slug) : false));
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formValues, setFormValues] = useState<FormValues>({});

  const {
    data: poll,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ['poll', slug, accessToken],
    queryFn: () => getPollBySlug(slug!, accessToken),
    enabled: !!slug && !alreadyResponded,
    retry: false,
  });

  const getDefaultValue = (q: Question): string | string[] =>
    q.type === 'MULTIPLE_CHOICE' ? [] : '';

  const getValue = (questionId: string, question: Question): string | string[] =>
    formValues[questionId] ?? getDefaultValue(question);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (!poll) throw new Error('Poll not loaded');
      const answers: AnswerPayload[] = poll.questions.map((q) => {
        const val = values[q.id];
        if (q.type === 'SINGLE_CHOICE') {
          return { questionId: q.id, optionId: val as string };
        } else if (q.type === 'MULTIPLE_CHOICE') {
          return { questionId: q.id, optionIds: val as string[] };
        } else {
          return { questionId: q.id, textValue: val as string };
        }
      });
      return submitResponse(slug!, {
        answers,
        respondentFingerprint: getOrCreateFingerprint(),
      });
    },
    onSuccess: () => {
      setRespondedCookie(slug!);
      setSubmitted(true);
      setSubmitError(null);
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setSubmitError('You have already submitted a response to this poll.');
      } else if (status === 429) {
        setSubmitError('Too many requests. Please wait a moment and try again.');
      } else if (status === 410) {
        setSubmitError('This poll has expired and is no longer accepting responses.');
      } else {
        setSubmitError('Something went wrong. Please try again.');
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!poll) return;
    const errs = validateAnswers(poll.questions, formValues);
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setFormErrors({});
    mutation.mutate(formValues);
  }

  // ─── States ─────────────────────────────────────────────────────────────────

  if (alreadyResponded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="text-4xl">✅</div>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Already responded</h1>
          <p className="mt-2 text-sm text-gray-600">
            You have already submitted a response to this poll. Thank you!
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  const httpStatus = (fetchError as { response?: { status?: number } })?.response?.status;

  if (fetchError) {
    if (httpStatus === 403) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="text-4xl">🔒</div>
            <h1 className="mt-4 text-xl font-semibold text-gray-900">Access denied</h1>
            <p className="mt-2 text-sm text-gray-600">
              This poll is private. You need a valid access link to view it.
            </p>
          </div>
        </div>
      );
    }
    if (httpStatus === 410) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="text-4xl">⏰</div>
            <h1 className="mt-4 text-xl font-semibold text-gray-900">Poll unavailable</h1>
            <p className="mt-2 text-sm text-gray-600">
              This poll has expired or is no longer active.
            </p>
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
        </div>
      </div>
    );
  }

  if (!poll) return null;

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="text-4xl">🎉</div>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Thank you!</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your response has been recorded successfully.
          </p>
        </div>
      </div>
    );
  }

  // ─── Poll form ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto w-full max-w-lg">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900">{poll.title}</h1>
          {poll.description && (
            <p className="mt-2 text-sm text-gray-600">{poll.description}</p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {poll.questions
              .slice()
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((question) => (
                <QuestionRenderer
                  key={question.id}
                  question={question}
                  value={getValue(question.id, question)}
                  onChange={(val) =>
                    setFormValues((prev) => ({ ...prev, [question.id]: val }))
                  }
                  error={formErrors[question.id]}
                />
              ))}

            {submitError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? 'Submitting…' : 'Submit response'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
