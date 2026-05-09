import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { PollDetail } from '../../types/poll';
import type { CreatePollPayload, CreateQuestionPayload } from '../../api/polls';
import Spinner from '../ui/Spinner';

// ─── Zod schema ───────────────────────────────────────────────────────────────

const optionSchema = z.object({
  text: z.string().min(1, 'Option text is required'),
});

const questionSchema = z
  .object({
    text: z.string().min(1, 'Question text is required'),
    type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TEXT']),
    isRequired: z.boolean(),
    options: z.array(optionSchema),
  })
  .superRefine((q, ctx) => {
    if ((q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE') && q.options.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Choice questions must have at least one option',
        path: ['options'],
      });
    }
    if (q.type === 'TEXT' && q.options.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Text questions must not have options',
        path: ['options'],
      });
    }
  });

const pollFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']),
  expiresAt: z.string().optional(),
  questions: z
    .array(questionSchema)
    .min(1, 'At least one question is required')
    .max(20, 'Maximum 20 questions allowed'),
});

type PollFormValues = z.infer<typeof pollFormSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface PollFormModalProps {
  poll?: PollDetail;
  onSubmit: (payload: CreatePollPayload) => Promise<void>;
  onClose: () => void;
  isSubmitting?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PollFormModal({
  poll,
  onSubmit,
  onClose,
  isSubmitting = false,
}: PollFormModalProps) {
  const isEditMode = !!poll;

  const defaultValues: PollFormValues = poll
    ? {
        title: poll.title,
        description: poll.description ?? '',
        visibility: poll.visibility,
        expiresAt: poll.expiresAt ? poll.expiresAt.slice(0, 16) : '',
        questions: (poll.questions ?? [])
          .slice()
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((q) => ({
            text: q.text,
            type: q.type,
            isRequired: q.isRequired,
            options: (q.options ?? [])
              .slice()
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((o) => ({ text: o.text })),
          })),
      }
    : {
        title: '',
        description: '',
        visibility: 'PUBLIC',
        expiresAt: '',
        questions: [{ text: '', type: 'SINGLE_CHOICE', isRequired: true, options: [{ text: '' }] }],
      };

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PollFormValues>({
    resolver: zodResolver(pollFormSchema),
    defaultValues,
  });

  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
    move: moveQuestion,
  } = useFieldArray({ control, name: 'questions' });

  const watchedQuestions = watch('questions');

  function handleFormSubmit(values: PollFormValues) {
    const payload: CreatePollPayload = {
      title: values.title,
      description: values.description || null,
      visibility: values.visibility,
      expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null,
      questions: values.questions.map((q, idx): CreateQuestionPayload => ({
        text: q.text,
        type: q.type,
        orderIndex: idx,
        isRequired: q.isRequired,
        options: q.options.map((o, oidx) => ({ text: o.text, orderIndex: oidx })),
      })),
    };
    void onSubmit(payload);
  }

  const inputBase =
    'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-4 sm:py-8"
      role="dialog"
      aria-modal="true"
      aria-label={isEditMode ? 'Edit poll' : 'Create poll'}
    >
      <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditMode ? 'Edit poll' : 'Create poll'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 p-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input {...register('title')} className={inputBase} placeholder="My poll" />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              {...register('description')}
              rows={2}
              className={inputBase}
              placeholder="Optional description"
            />
          </div>

          {/* Visibility + Expiry */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Visibility</label>
              <select {...register('visibility')} className={inputBase}>
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Expires at</label>
              <input
                {...register('expiresAt')}
                type="datetime-local"
                className={inputBase}
              />
            </div>
          </div>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Questions <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-500">
                {questionFields.length}/20
              </span>
            </div>
            {errors.questions && !Array.isArray(errors.questions) && (
              <p className="mt-1 text-xs text-red-600">{errors.questions.message}</p>
            )}

            <div className="mt-3 space-y-4">
              {questionFields.map((qField, qIdx) => (
                <QuestionEditor
                  key={qField.id}
                  qIdx={qIdx}
                  control={control}
                  register={register}
                  errors={errors}
                  watchedType={watchedQuestions[qIdx]?.type ?? 'SINGLE_CHOICE'}
                  onRemove={() => removeQuestion(qIdx)}
                  onMoveUp={qIdx > 0 ? () => moveQuestion(qIdx, qIdx - 1) : undefined}
                  onMoveDown={
                    qIdx < questionFields.length - 1
                      ? () => moveQuestion(qIdx, qIdx + 1)
                      : undefined
                  }
                  canRemove={questionFields.length > 1}
                />
              ))}
            </div>

            {questionFields.length < 20 && (
              <button
                type="button"
                onClick={() =>
                  appendQuestion({
                    text: '',
                    type: 'SINGLE_CHOICE',
                    isRequired: true,
                    options: [{ text: '' }],
                  })
                }
                className="mt-3 text-sm text-indigo-600 hover:underline"
              >
                + Add question
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSubmitting && <Spinner size="sm" />}
              {isEditMode ? 'Save changes' : 'Create poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── QuestionEditor sub-component ────────────────────────────────────────────

import { useFieldArray as useFA } from 'react-hook-form';
import type { Control, UseFormRegister, FieldErrors } from 'react-hook-form';

interface QuestionEditorProps {
  qIdx: number;
  control: Control<PollFormValues>;
  register: UseFormRegister<PollFormValues>;
  errors: FieldErrors<PollFormValues>;
  watchedType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT';
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canRemove: boolean;
}

function QuestionEditor({
  qIdx,
  control,
  register,
  errors,
  watchedType,
  onRemove,
  onMoveUp,
  onMoveDown,
  canRemove,
}: QuestionEditorProps) {
  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFA({ control, name: `questions.${qIdx}.options` });

  const inputBase =
    'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

  const qErrors = errors.questions?.[qIdx];

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-500">Question {qIdx + 1}</span>
        <div className="flex items-center gap-1">
          {onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              className="rounded p-1 text-gray-400 hover:bg-gray-200"
              aria-label="Move up"
            >
              ↑
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              className="rounded p-1 text-gray-400 hover:bg-gray-200"
              aria-label="Move down"
            >
              ↓
            </button>
          )}
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="rounded p-1 text-red-400 hover:bg-red-50"
              aria-label="Remove question"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Question text */}
      <div className="mt-2">
        <input
          {...register(`questions.${qIdx}.text`)}
          className={inputBase}
          placeholder="Question text"
        />
        {qErrors?.text && (
          <p className="mt-1 text-xs text-red-600">{qErrors.text.message}</p>
        )}
      </div>

      {/* Type + Required */}
      <div className="mt-2 flex gap-3">
        <div className="min-w-0 flex-1">
          <select {...register(`questions.${qIdx}.type`)} className={inputBase}>
            <option value="SINGLE_CHOICE">Single choice</option>
            <option value="MULTIPLE_CHOICE">Multiple choice</option>
            <option value="TEXT">Text</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            {...register(`questions.${qIdx}.isRequired`)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600"
          />
          Required
        </label>
      </div>

      {/* Options (for choice questions) */}
      {(watchedType === 'SINGLE_CHOICE' || watchedType === 'MULTIPLE_CHOICE') && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-gray-600">Options</p>
          {optionFields.map((oField, oIdx) => (
            <div key={oField.id} className="flex items-center gap-2">
              <input
                {...register(`questions.${qIdx}.options.${oIdx}.text`)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder={`Option ${oIdx + 1}`}
              />
              {optionFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeOption(oIdx)}
                  className="text-red-400 hover:text-red-600"
                  aria-label="Remove option"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {/* Options error */}
          {qErrors?.options && !Array.isArray(qErrors.options) && (
            <p className="text-xs text-red-600">
              {(qErrors.options as { message?: string }).message}
            </p>
          )}
          <button
            type="button"
            onClick={() => appendOption({ text: '' })}
            className="text-xs text-indigo-600 hover:underline"
          >
            + Add option
          </button>
        </div>
      )}
    </div>
  );
}
