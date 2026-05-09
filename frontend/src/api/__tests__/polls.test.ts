import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../client';
import {
  getPollBySlug,
  submitResponse,
  getMyPolls,
  createPoll,
  updatePoll,
  replaceQuestions,
  deletePoll,
  regenerateToken,
  getPollAnalytics,
  exportPollCsv,
  getPublicPolls,
} from '../polls';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);
const mockPatch = vi.mocked(apiClient.patch);
const mockPut = vi.mocked(apiClient.put);
const mockDelete = vi.mocked(apiClient.delete);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('polls API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Public poll endpoints ─────────────────────────────────────────────────

  describe('getPollBySlug', () => {
    it('calls GET /polls/:slug without accessToken', async () => {
      mockGet.mockResolvedValue({ data: { id: 'poll-1', slug: 'my-poll' } });

      await getPollBySlug('my-poll');

      expect(mockGet).toHaveBeenCalledWith('/polls/my-poll', { params: {} });
    });

    it('calls GET /polls/:slug with accessToken query param', async () => {
      mockGet.mockResolvedValue({ data: { id: 'poll-1', slug: 'my-poll' } });

      await getPollBySlug('my-poll', 'secret-token');

      expect(mockGet).toHaveBeenCalledWith('/polls/my-poll', {
        params: { accessToken: 'secret-token' },
      });
    });
  });

  describe('submitResponse', () => {
    it('calls POST /polls/:slug/responses with payload', async () => {
      mockPost.mockResolvedValue({ data: { id: 'resp-1', submittedAt: '2026-01-01T00:00:00Z' } });

      const payload = {
        answers: [{ questionId: 'q1', optionId: 'o1' }],
        respondentFingerprint: 'fp-uuid',
      };

      await submitResponse('my-poll', payload);

      expect(mockPost).toHaveBeenCalledWith('/polls/my-poll/responses', payload);
    });
  });

  describe('getPublicPolls', () => {
    it('calls GET /polls with params', async () => {
      mockGet.mockResolvedValue({ data: { data: [], total: 0, page: 1, limit: 10 } });

      await getPublicPolls({ page: 2, limit: 5, search: 'test' });

      expect(mockGet).toHaveBeenCalledWith('/polls', {
        params: { page: 2, limit: 5, search: 'test' },
      });
    });
  });

  // ─── Authenticated poll management ────────────────────────────────────────

  describe('getMyPolls', () => {
    it('calls GET /polls/my with params', async () => {
      mockGet.mockResolvedValue({ data: { data: [], total: 0, page: 1, limit: 10 } });

      await getMyPolls({ page: 1, limit: 10 });

      expect(mockGet).toHaveBeenCalledWith('/polls/my', {
        params: { page: 1, limit: 10 },
      });
    });

    it('calls GET /polls/my without params', async () => {
      mockGet.mockResolvedValue({ data: { data: [], total: 0, page: 1, limit: 10 } });

      await getMyPolls();

      expect(mockGet).toHaveBeenCalledWith('/polls/my', { params: undefined });
    });
  });

  describe('createPoll', () => {
    it('calls POST /polls with payload', async () => {
      mockPost.mockResolvedValue({ data: { id: 'new-poll' } });

      const payload = {
        title: 'My Poll',
        visibility: 'PUBLIC' as const,
        questions: [
          {
            text: 'Q1',
            type: 'SINGLE_CHOICE' as const,
            orderIndex: 0,
            isRequired: true,
            options: [{ text: 'A', orderIndex: 0 }],
          },
        ],
      };

      await createPoll(payload);

      expect(mockPost).toHaveBeenCalledWith('/polls', payload);
    });
  });

  describe('updatePoll', () => {
    it('calls PATCH /polls/:slug with payload', async () => {
      mockPatch.mockResolvedValue({ data: { id: 'poll-1' } });

      await updatePoll('my-poll', { title: 'Updated', isActive: false });

      expect(mockPatch).toHaveBeenCalledWith('/polls/my-poll', {
        title: 'Updated',
        isActive: false,
      });
    });
  });

  describe('replaceQuestions', () => {
    it('calls PUT /polls/:slug/questions with questions array', async () => {
      mockPut.mockResolvedValue({ data: { id: 'poll-1' } });

      const questions = [
        {
          text: 'New Q',
          type: 'TEXT' as const,
          orderIndex: 0,
          isRequired: false,
          options: [],
        },
      ];

      await replaceQuestions('my-poll', questions);

      expect(mockPut).toHaveBeenCalledWith('/polls/my-poll/questions', { questions });
    });
  });

  describe('deletePoll', () => {
    it('calls DELETE /polls/:slug', async () => {
      mockDelete.mockResolvedValue({ data: undefined });

      await deletePoll('my-poll');

      expect(mockDelete).toHaveBeenCalledWith('/polls/my-poll');
    });
  });

  describe('regenerateToken', () => {
    it('calls POST /polls/:slug/regenerate-token', async () => {
      mockPost.mockResolvedValue({ data: { accessToken: 'new-token' } });

      const result = await regenerateToken('my-poll');

      expect(mockPost).toHaveBeenCalledWith('/polls/my-poll/regenerate-token');
      expect(result).toEqual({ accessToken: 'new-token' });
    });
  });

  // ─── Analytics ────────────────────────────────────────────────────────────

  describe('getPollAnalytics', () => {
    it('calls GET /analytics/:slug', async () => {
      mockGet.mockResolvedValue({
        data: { totalResponses: 10, responsesOverTime: [], questions: [] },
      });

      await getPollAnalytics('my-poll');

      expect(mockGet).toHaveBeenCalledWith('/analytics/my-poll');
    });
  });

  describe('exportPollCsv', () => {
    it('calls GET /analytics/:slug/export with responseType blob and triggers download', async () => {
      // Mock URL and document APIs
      const mockUrl = 'blob:http://localhost/fake-url';
      const createObjectURL = vi.fn().mockReturnValue(mockUrl);
      const revokeObjectURL = vi.fn();
      global.URL.createObjectURL = createObjectURL;
      global.URL.revokeObjectURL = revokeObjectURL;

      const mockClick = vi.fn();
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      const mockAnchor = { href: '', download: '', click: mockClick } as unknown as HTMLAnchorElement;
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
      vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);

      mockGet.mockResolvedValue({ data: new Blob(['csv,data'], { type: 'text/csv' }) });

      await exportPollCsv('my-poll');

      expect(mockGet).toHaveBeenCalledWith('/analytics/my-poll/export', {
        responseType: 'blob',
      });
      expect(mockClick).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });
  });
});
