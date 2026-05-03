import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  poll: {
    findUnique: jest.fn(),
  },
  response: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  answer: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

const basePoll = {
  id: 'poll-id',
  slug: 'test-poll',
  title: 'Test Poll',
  questions: [
    {
      id: 'q1',
      text: 'Favorite color?',
      type: 'SINGLE_CHOICE',
      orderIndex: 0,
      options: [
        { id: 'opt1', text: 'Red', orderIndex: 0 },
        { id: 'opt2', text: 'Blue', orderIndex: 1 },
      ],
    },
    {
      id: 'q2',
      text: 'Comments?',
      type: 'TEXT',
      orderIndex: 1,
      options: [],
    },
  ],
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    jest.clearAllMocks();
  });

  describe('getAnalytics', () => {
    it('should return analytics for a poll', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(basePoll);
      mockPrismaService.response.count.mockResolvedValue(42);
      mockPrismaService.$queryRaw.mockResolvedValue([
        { date: new Date('2025-01-01'), count: BigInt(20) },
        { date: new Date('2025-01-02'), count: BigInt(22) },
      ]);

      // For SINGLE_CHOICE question q1
      mockPrismaService.answer.count
        .mockResolvedValueOnce(42) // totalAnswers for q1
        .mockResolvedValueOnce(20) // count for opt1
        .mockResolvedValueOnce(22); // count for opt2

      // For TEXT question q2
      mockPrismaService.answer.findMany.mockResolvedValue([
        { textValue: 'Great poll!' },
        { textValue: 'Very interesting' },
      ]);

      const result = await service.getAnalytics('test-poll');

      expect(result.totalResponses).toBe(42);
      expect(result.responsesOverTime).toHaveLength(2);
      expect(result.responsesOverTime[0]).toEqual({ date: '2025-01-01', count: 20 });
      expect(result.responsesOverTime[1]).toEqual({ date: '2025-01-02', count: 22 });
      expect(result.questions).toHaveLength(2);

      // SINGLE_CHOICE question
      const choiceQuestion = result.questions[0];
      expect(choiceQuestion.questionId).toBe('q1');
      expect(choiceQuestion.type).toBe('SINGLE_CHOICE');
      expect(choiceQuestion.totalAnswers).toBe(42);
      expect(choiceQuestion.options).toHaveLength(2);
      expect(choiceQuestion.options[0]).toEqual({
        optionId: 'opt1',
        text: 'Red',
        count: 20,
        percentage: 47.6,
      });

      // TEXT question
      const textQuestion = result.questions[1];
      expect(textQuestion.questionId).toBe('q2');
      expect(textQuestion.type).toBe('TEXT');
      expect(textQuestion.totalAnswers).toBe(2);
      expect(textQuestion.textAnswers).toEqual(['Great poll!', 'Very interesting']);
    });

    it('should throw NotFoundException if poll does not exist', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(null);

      await expect(service.getAnalytics('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should return 0 percentage when there are no answers', async () => {
      const pollWithNoAnswers = {
        ...basePoll,
        questions: [
          {
            id: 'q1',
            text: 'Favorite color?',
            type: 'SINGLE_CHOICE',
            orderIndex: 0,
            options: [{ id: 'opt1', text: 'Red', orderIndex: 0 }],
          },
        ],
      };
      mockPrismaService.poll.findUnique.mockResolvedValue(pollWithNoAnswers);
      mockPrismaService.response.count.mockResolvedValue(0);
      mockPrismaService.$queryRaw.mockResolvedValue([]);
      mockPrismaService.answer.count
        .mockResolvedValueOnce(0) // totalAnswers
        .mockResolvedValueOnce(0); // count for opt1

      const result = await service.getAnalytics('test-poll');

      expect(result.questions[0].options[0].percentage).toBe(0);
    });

    it('should handle empty text answers', async () => {
      const pollWithTextOnly = {
        ...basePoll,
        questions: [
          {
            id: 'q2',
            text: 'Comments?',
            type: 'TEXT',
            orderIndex: 0,
            options: [],
          },
        ],
      };
      mockPrismaService.poll.findUnique.mockResolvedValue(pollWithTextOnly);
      mockPrismaService.response.count.mockResolvedValue(0);
      mockPrismaService.$queryRaw.mockResolvedValue([]);
      mockPrismaService.answer.findMany.mockResolvedValue([]);

      const result = await service.getAnalytics('test-poll');

      expect(result.questions[0].totalAnswers).toBe(0);
      expect(result.questions[0].textAnswers).toEqual([]);
    });
  });

  describe('exportCsv', () => {
    it('should throw NotFoundException if poll does not exist', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(null);

      const mockRes = {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      } as any;

      await expect(service.exportCsv('nonexistent', mockRes)).rejects.toThrow(NotFoundException);
    });

    it('should set correct CSV headers and stream data', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(basePoll);
      mockPrismaService.response.findMany.mockResolvedValue([
        {
          id: 'resp-1',
          submittedAt: new Date('2025-01-01T10:00:00Z'),
          user: { name: 'Alice' },
          answers: [
            { questionId: 'q1', option: { text: 'Red' }, textValue: null },
            { questionId: 'q2', option: null, textValue: 'Great poll!' },
          ],
        },
      ]);

      const chunks: string[] = [];
      const mockRes = {
        setHeader: jest.fn(),
        write: jest.fn((chunk) => chunks.push(chunk)),
        end: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        emit: jest.fn(),
      } as any;

      // We just verify it doesn't throw and sets headers
      await service.exportCsv('test-poll', mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="test-poll-results.csv"',
      );
    });
  });
});
