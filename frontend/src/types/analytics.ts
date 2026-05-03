import type { QuestionType } from './poll';

export interface ResponseOverTime {
  date: string;
  count: number;
}

export interface OptionAnalytics {
  optionId: string;
  text: string;
  count: number;
  percentage: number;
}

export interface QuestionAnalytics {
  questionId: string;
  questionText: string;
  type: QuestionType;
  totalAnswers: number;
  options?: OptionAnalytics[];
  textAnswers?: string[];
}

export interface Analytics {
  totalResponses: number;
  responsesOverTime: ResponseOverTime[];
  questions: QuestionAnalytics[];
}

export interface AdminStats {
  totalUsers: number;
  totalPolls: number;
  totalResponses: number;
}
