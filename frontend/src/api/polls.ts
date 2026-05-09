import { apiClient } from './client';
import type { PollDetail, PollSummary, PaginatedPolls, SubmitResponsePayload } from '../types/poll';
import type { Analytics } from '../types/analytics';

export interface PollsQuery {
  page?: number;
  limit?: number;
  search?: string;
}

// ─── Public Poll Endpoints ────────────────────────────────────────────────────

export async function getPollBySlug(slug: string, accessToken?: string): Promise<PollDetail> {
  const params: Record<string, string> = {};
  if (accessToken) {
    params.accessToken = accessToken;
  }
  const { data } = await apiClient.get<PollDetail>(`/polls/${slug}`, { params });
  return data;
}

export async function submitResponse(
  slug: string,
  payload: SubmitResponsePayload,
): Promise<{ id: string; submittedAt: string }> {
  const { data } = await apiClient.post<{ id: string; submittedAt: string }>(
    `/polls/${slug}/responses`,
    payload,
  );
  return data;
}

// ─── Authenticated Poll Management ───────────────────────────────────────────

export async function getMyPolls(params?: PollsQuery): Promise<PaginatedPolls> {
  const { data } = await apiClient.get<PaginatedPolls>('/polls/my', { params });
  return data;
}

export interface CreatePollPayload {
  title: string;
  description?: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  expiresAt?: string | null;
  questions: CreateQuestionPayload[];
}

export interface CreateQuestionPayload {
  text: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT';
  orderIndex: number;
  isRequired: boolean;
  options: CreateOptionPayload[];
}

export interface CreateOptionPayload {
  text: string;
  orderIndex: number;
}

export interface UpdatePollPayload {
  title?: string;
  description?: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE';
  isActive?: boolean;
  expiresAt?: string | null;
}

export async function createPoll(payload: CreatePollPayload): Promise<PollDetail> {
  const { data } = await apiClient.post<PollDetail>('/polls', payload);
  return data;
}

export async function updatePoll(slug: string, payload: UpdatePollPayload): Promise<PollDetail> {
  const { data } = await apiClient.patch<PollDetail>(`/polls/${slug}`, payload);
  return data;
}

export async function replaceQuestions(
  slug: string,
  questions: CreateQuestionPayload[],
): Promise<PollDetail> {
  const { data } = await apiClient.put<PollDetail>(`/polls/${slug}/questions`, { questions });
  return data;
}

export async function deletePoll(slug: string): Promise<void> {
  await apiClient.delete(`/polls/${slug}`);
}

export async function regenerateToken(slug: string): Promise<{ accessToken: string }> {
  const { data } = await apiClient.post<{ accessToken: string }>(
    `/polls/${slug}/regenerate-token`,
  );
  return data;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getPollAnalytics(slug: string): Promise<Analytics> {
  const { data } = await apiClient.get<Analytics>(`/analytics/${slug}`);
  return data;
}

export async function exportPollCsv(slug: string): Promise<void> {
  const response = await apiClient.get(`/analytics/${slug}/export`, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data as BlobPart], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}-results.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Public Poll List ─────────────────────────────────────────────────────────

export async function getPublicPolls(params?: PollsQuery): Promise<{ data: PollSummary[]; total: number; page: number; limit: number }> {
  const { data } = await apiClient.get<{ data: PollSummary[]; total: number; page: number; limit: number }>('/polls', { params });
  return data;
}
