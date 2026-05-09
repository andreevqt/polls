import type { QuestionAnalytics } from '../../types/analytics';

interface QuestionAnalyticsCardProps {
  question: QuestionAnalytics;
}

export default function QuestionAnalyticsCard({ question }: QuestionAnalyticsCardProps) {
  const isChoice = question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-sm font-semibold text-gray-900">{question.questionText}</h3>
        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          {question.totalAnswers} {question.totalAnswers === 1 ? 'answer' : 'answers'}
        </span>
      </div>

      {isChoice && question.options && question.options.length > 0 && (
        <div className="mt-4 space-y-3">
          {question.options.map((opt) => (
            <div key={opt.optionId}>
              <div className="flex items-center justify-between text-xs text-gray-700">
                <span>{opt.text}</span>
                <span className="font-medium">
                  {opt.count} ({opt.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${Math.min(opt.percentage, 100)}%` }}
                  role="progressbar"
                  aria-valuenow={opt.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${opt.text}: ${opt.percentage.toFixed(1)}%`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {question.type === 'TEXT' && question.textAnswers && (
        <div className="mt-4 max-h-48 space-y-2 overflow-y-auto">
          {question.textAnswers.length === 0 ? (
            <p className="text-xs text-gray-500">No text answers yet.</p>
          ) : (
            question.textAnswers.map((answer, idx) => (
              <div
                key={idx}
                className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-700"
              >
                {answer}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
