import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, GoneException } from '@nestjs/common';
import { PollsService } from './polls.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('../common/utils/slugify', () => ({
  generateSlug: jest.fn(() => 'test-poll-ab12'),
}));

const mockPrismaService = {
  poll: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  question: {
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

const basePoll = {
  id: 'poll-id',
  title: 'Test Poll',
  slug: 'test-poll-ab12',
  description: 'A test poll',
  visibility: 'PUBLIC',
  isActive: true,
  expiresAt: null,
  accessToken: 'access-token-uuid',
  ownerId: 'user-id',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  owner: { id: 'user-id', name: 'Alice' },
  questions: [],
};

describe('PollsService', () => {
  let service: PollsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PollsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PollsService>(PollsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated public active polls', async () => {
      const polls = [
        { ...basePoll, _count: { responses: 5 } },
      ];
      mockPrismaService.poll.findMany.mockResolvedValue(polls);
      mockPrismaService.poll.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].responseCount).toBe(5);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(mockPrismaService.poll.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ visibility: 'PUBLIC', isActive: true }),
        }),
      );
    });

    it('should apply search filter when provided', async () => {
      mockPrismaService.poll.findMany.mockResolvedValue([]);
      mockPrismaService.poll.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, search: 'color' });

      expect(mockPrismaService.poll.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            title: { contains: 'color', mode: 'insensitive' },
          }),
        }),
      );
    });
  });

  describe('findByOwner', () => {
    it('should return paginated polls for a specific owner', async () => {
      const polls = [{ ...basePoll, _count: { responses: 3 } }];
      mockPrismaService.poll.findMany.mockResolvedValue(polls);
      mockPrismaService.poll.count.mockResolvedValue(1);

      const result = await service.findByOwner('user-id', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].responseCount).toBe(3);
      expect(mockPrismaService.poll.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ownerId: 'user-id' } }),
      );
    });
  });

  describe('findBySlug', () => {
    it('should return a public poll by slug', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(basePoll);

      const result = await service.findBySlug('test-poll-ab12');

      expect(result).toEqual(basePoll);
    });

    it('should throw NotFoundException if poll does not exist', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw GoneException if poll has expired', async () => {
      const expiredPoll = { ...basePoll, expiresAt: new Date('2000-01-01') };
      mockPrismaService.poll.findUnique.mockResolvedValue(expiredPoll);

      await expect(service.findBySlug('test-poll-ab12')).rejects.toThrow(GoneException);
    });

    it('should throw ForbiddenException for private poll without access token', async () => {
      const privatePoll = { ...basePoll, visibility: 'PRIVATE', accessToken: 'secret-token' };
      mockPrismaService.poll.findUnique.mockResolvedValue(privatePoll);

      await expect(service.findBySlug('test-poll-ab12')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for private poll with wrong access token', async () => {
      const privatePoll = { ...basePoll, visibility: 'PRIVATE', accessToken: 'secret-token' };
      mockPrismaService.poll.findUnique.mockResolvedValue(privatePoll);

      await expect(service.findBySlug('test-poll-ab12', 'wrong-token')).rejects.toThrow(ForbiddenException);
    });

    it('should return private poll with correct access token', async () => {
      const privatePoll = { ...basePoll, visibility: 'PRIVATE', accessToken: 'secret-token' };
      mockPrismaService.poll.findUnique.mockResolvedValue(privatePoll);

      const result = await service.findBySlug('test-poll-ab12', 'secret-token');

      expect(result).toEqual(privatePoll);
    });
  });

  describe('create', () => {
    const createDto = {
      title: 'Test Poll',
      description: 'A test poll',
      visibility: 'PUBLIC' as any,
      questions: [
        {
          text: 'What is your favorite color?',
          type: 'SINGLE_CHOICE' as any,
          orderIndex: 0,
          isRequired: true,
          options: [
            { text: 'Red', orderIndex: 0 },
            { text: 'Blue', orderIndex: 1 },
          ],
        },
      ],
    };

    it('should create a poll with questions in a transaction', async () => {
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockPrismaService));
      mockPrismaService.poll.create.mockResolvedValue(basePoll);

      const result = await service.create('user-id', createDto);

      expect(result).toEqual(basePoll);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.poll.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Test Poll',
            ownerId: 'user-id',
            slug: 'test-poll-ab12',
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update poll metadata', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(basePoll);
      const updatedPoll = { ...basePoll, title: 'Updated Title' };
      mockPrismaService.poll.update.mockResolvedValue(updatedPoll);

      const result = await service.update('test-poll-ab12', { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
      expect(mockPrismaService.poll.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: 'test-poll-ab12' },
          data: { title: 'Updated Title' },
        }),
      );
    });

    it('should throw NotFoundException if poll does not exist', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', { title: 'New' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a poll by slug', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(basePoll);
      mockPrismaService.poll.delete.mockResolvedValue(basePoll);

      await service.delete('test-poll-ab12');

      expect(mockPrismaService.poll.delete).toHaveBeenCalledWith({
        where: { slug: 'test-poll-ab12' },
      });
    });

    it('should throw NotFoundException if poll does not exist', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteById', () => {
    it('should delete a poll by id', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(basePoll);
      mockPrismaService.poll.delete.mockResolvedValue(basePoll);

      await service.deleteById('poll-id');

      expect(mockPrismaService.poll.delete).toHaveBeenCalledWith({
        where: { id: 'poll-id' },
      });
    });

    it('should throw NotFoundException if poll does not exist', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(null);

      await expect(service.deleteById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('regenerateAccessToken', () => {
    it('should generate a new access token for the poll', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(basePoll);
      mockPrismaService.poll.update.mockResolvedValue({});

      const result = await service.regenerateAccessToken('test-poll-ab12');

      expect(result).toHaveProperty('accessToken');
      expect(typeof result.accessToken).toBe('string');
      expect(mockPrismaService.poll.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug: 'test-poll-ab12' } }),
      );
    });

    it('should throw NotFoundException if poll does not exist', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(null);

      await expect(service.regenerateAccessToken('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('replaceQuestions', () => {
    it('should replace all questions in a transaction', async () => {
      mockPrismaService.poll.findUnique
        .mockResolvedValueOnce(basePoll)
        .mockResolvedValueOnce({ ...basePoll, questions: [] });
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockPrismaService));
      mockPrismaService.question.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.question.create.mockResolvedValue({});

      const dto = {
        questions: [
          {
            text: 'New question?',
            type: 'TEXT' as any,
            orderIndex: 0,
            isRequired: false,
            options: [],
          },
        ],
      };

      await service.replaceQuestions('test-poll-ab12', dto);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.question.deleteMany).toHaveBeenCalledWith({
        where: { pollId: 'poll-id' },
      });
      expect(mockPrismaService.question.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if poll does not exist', async () => {
      mockPrismaService.poll.findUnique.mockResolvedValue(null);

      await expect(
        service.replaceQuestions('nonexistent', { questions: [] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllAdmin', () => {
    it('should return all polls without visibility filter', async () => {
      const polls = [
        { ...basePoll, _count: { responses: 2 } },
        { ...basePoll, id: 'poll-2', visibility: 'PRIVATE', _count: { responses: 0 } },
      ];
      mockPrismaService.poll.findMany.mockResolvedValue(polls);
      mockPrismaService.poll.count.mockResolvedValue(2);

      const result = await service.findAllAdmin({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      // No visibility filter
      expect(mockPrismaService.poll.findMany).toHaveBeenCalledWith(
        expect.not.objectContaining({ where: expect.objectContaining({ visibility: 'PUBLIC' }) }),
      );
    });
  });
});
