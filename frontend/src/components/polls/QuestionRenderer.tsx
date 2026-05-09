import type { Question, PollOption } from '../../types/poll';

interface QuestionRendererProps {
  question: Question;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  error?: string;
}

export default function QuestionRenderer({
  question,
  value,
  onChange,
  error,
}: QuestionRendererProps) {
  const inputBase =
    'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-900">
        {question.text}
        {question.isRequired && <span className="ml-1 text-red-500">*</span>}
      </p>

      {question.type === 'SINGLE_CHOICE' && (
        <div className="space-y-2">
          {question.options.map((option: PollOption) => (
            <label key={option.id} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option.id}
                checked={value === option.id}
                onChange={() => onChange(option.id)}
                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{option.text}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'MULTIPLE_CHOICE' && (
        <div className="space-y-2">
          {question.options.map((option: PollOption) => {
            const selected = Array.isArray(value) ? value : [];
            const isChecked = selected.includes(option.id);
            return (
              <label key={option.id} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  value={option.id}
                  checked={isChecked}
                  onChange={() => {
                    if (isChecked) {
                      onChange(selected.filter((v) => v !== option.id));
                    } else {
                      onChange([...selected, option.id]);
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{option.text}</span>
              </label>
            );
          })}
        </div>
      )}

      {question.type === 'TEXT' && (
        <textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={inputBase}
          placeholder="Your answer…"
        />
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
