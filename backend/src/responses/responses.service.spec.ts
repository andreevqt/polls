import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  GoneException,
  BadRequestException,
} from '@nestjs/common';
import { ResponsesService } from './responses.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  poll: {
    findUnique: jest.fn(),
  },
  response: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

const basePoll = {
  id: 'poll-id',
  slug: 'test-poll',
  isActive: true,
  expiresAt: null,
  visibility: 'PUBLIC',
  accessToken: 'access-token',
  questions: [
    {
      id: 'q1',
      text: 'Favorite color?',
      type: 'SINGLE_CHOICE',
      isRequired: true,
      options: [
        { id: 'opt1', text: 'Red' },
        { id: 'opt2', text: 'Blue' },
      ],
    },
    {
      id: 'q2',
      text: 'Comments?',
      type: 'TEXT',
      isRequired: false,
      options: [],
    },
  ],
};

describe('ResponsesService', () => {
  let service: ResponsesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponsesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ResponsesService>(ResponsesService);
    jest.clearAllMocks();
  });

  describe('submit', () => {
    const validDto = {
      answers: [{ questionId: 'q1', optionId: 'opt1', textValue: null }],
    };

    it('should submit a response successfully for authenticated user', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(basePoll);
      mockPrismaService.response.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation(async (fn) => {
        const created = { id: 'response-id', submittedAt: new Date('2025-01-01') };
        mockPrismaService.response.create.mockResolvedValue(created);
        return fn(mockPrismaService);
      });

      const result = await service.submit('test-poll', validDto, 'user-id');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('submittedAt');
    });

    it('should submit a response for anonymous user with fingerprint', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(basePoll);
      mockPrismaService.response.findFirst.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation(async (fn) => {
        const created = { id: 'response-id', submittedAt: new Date('2025-01-01') };
        mockPrismaService.response.create.mockResolvedValue(created);
        return fn(mockPrismaService);
      });

      const result = await service.submit('test-poll', validDto, undefined, 'fingerprint-abc');

      expect(result).toHaveProperty('id');
    });

    it('should throw NotFoundException if poll does not exist', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(null);

      await expect(service.submit('nonexistent', validDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw GoneException if poll is not active', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue({ ...basePoll, isActive: false });

      await expect(service.submit('test-poll', validDto)).rejects.toThrow(GoneException);
    });

    it('should throw GoneException if poll has expired', async () => {
      const expiredPoll = { ...basePoll, expiresAt: new Date('2000-01-01') };
      mockPrismaService.poll.findUnique.mockResolvedValue(expiredPoll);

      await expect(service.submit('test-poll', validDto)).rejects.toThrow(GoneException);
    });

    it('should throw ConflictException if authenticated user already responded', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(basePoll);
      mockPrismaService.response.findUnique.mockResolvedValue({ id: 'existing-response' });

      await expect(service.submit('test-poll', validDto, 'user-id')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if anonymous user with same fingerprint already responded', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(basePoll);
      mockPrismaService.response.findFirst.mockResolvedValue({ id: 'existing-response' });

      await expect(
        service.submit('test-poll', validDto, undefined, 'fingerprint-abc'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if required question is not answered', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(basePoll);
      mockPrismaService.response.findUnique.mockResolvedValue(null);

      const dtoWithMissingAnswer = { answers: [] };

      await expect(service.submit('test-poll', dtoWithMissingAnswer, 'user-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if choice question answered without optionId', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(basePoll);
      mockPrismaService.response.findUnique.mockResolvedValue(null);

      const dtoWithTextForChoice = {
        answers: [{ questionId: 'q1', optionId: null, textValue: 'some text' }],
      };

      await expect(service.submit('test-poll', dtoWithTextForChoice, 'user-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if required text question has no textValue', async () => {
      const pollWithRequiredText = {
        ...basePoll,
        questions: [
          {
            id: 'q-text',
            text: 'Describe yourself',
            type: 'TEXT',
            isRequired: true,
            options: [],
          },
        ],
      };
      mockPrismaService.poll.findUnique.mockResolvedValue(pollWithRequiredText);
      mockPrismaService.response.findUnique.mockResolvedValue(null);

      const dtoWithEmptyText = {
        answers: [{ questionId: 'q-text', optionId: null, textValue: null }],
      };

      await expect(service.submit('test-poll', dtoWithEmptyText, 'user-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findByPoll', () => {
    it('should return paginated responses for a poll', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(basePoll);
      const responses = [
        {
          id: 'response-id',
          submittedAt: new Date(),
          user: { id: 'user-id', name: 'Alice' },
          answers: [{ questionId: 'q1', optionId: 'opt1', textValue: null }],
        },
      ];
      mockPrismaService.response.findMany.mockResolvedValue(responses);
      mockPrismaService.response.count.mockResolvedValue(1);

      const result = await service.findByPoll('test-poll', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should throw NotFoundException if poll does not exist', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(null);

      await expect(service.findByPoll('nonexistent', {})).rejects.toThrow(NotFoundException);
    });
  });
});
