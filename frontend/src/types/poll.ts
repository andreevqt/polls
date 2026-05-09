export type PollVisibility = 'PUBLIC' | 'PRIVATE';
export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT';

export interface PollOwner {
  id: string;
  name: string;
}

export interface PollOption {
  id: string;
  text: string;
  orderIndex: number;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  orderIndex: number;
  isRequired: boolean;
  options: PollOption[];
}

export interface Poll {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  visibility: PollVisibility;
  isActive: boolean;
  expiresAt: string | null;
  responseCount: number;
  owner: PollOwner;
  questions: Question[];
  createdAt: string;
}

export interface PollSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  visibility: PollVisibility;
  isActive: boolean;
  expiresAt: string | null;
  responseCount: number;
  owner: PollOwner;
  createdAt: string;
  updatedAt?: string;
}

/** Full poll detail including questions — returned by GET /polls/:slug */
export interface PollDetail extends PollSummary {
  questions: Question[];
  accessToken: string | null;
  updatedAt: string;
}

export interface PaginatedPolls {
  data: PollSummary[];
  total: number;
  page: number;
  limit: number;
}

// ─── Response submission types ────────────────────────────────────────────────

export interface AnswerPayload {
  questionId: string;
  /** For SINGLE_CHOICE */
  optionId?: string;
  /** For MULTIPLE_CHOICE */
  optionIds?: string[];
  /** For TEXT */
  textValue?: string;
}

export interface SubmitResponsePayload {
  answers: AnswerPayload[];
  respondentFingerprint: string;
}
