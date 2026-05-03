import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  GoneException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { PollQueryDto } from './dto/poll-query.dto';
import { ReplaceQuestionsDto } from '../questions/dto/replace-questions.dto';
import { generateSlug } from '../common/utils/slugify';
import { getPaginationParams } from '../common/utils/pagination';

const POLL_INCLUDE = {
  owner: { select: { id: true, name: true } },
  questions: {
    orderBy: { orderIndex: 'asc' as const },
    include: {
      options: { orderBy: { orderIndex: 'asc' as const } },
    },
  },
};

@Injectable()
export class PollsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PollQueryDto) {
    const { skip, take, page, limit } = getPaginationParams(query);
    const now = new Date();

    const where: any = {
      visibility: 'PUBLIC',
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };

    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    const [polls, total] = await Promise.all([
      this.prisma.poll.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, name: true } },
          _count: { select: { responses: true } },
        },
      }),
      this.prisma.poll.count({ where }),
    ]);

    const data = polls.map((poll) => ({
      id: poll.id,
      title: poll.title,
      slug: poll.slug,
      description: poll.description,
      visibility: poll.visibility,
      expiresAt: poll.expiresAt,
      responseCount: poll._count.responses,
      owner: poll.owner,
      createdAt: poll.createdAt,
    }));

    return { data, total, page, limit };
  }

  async findByOwner(userId: string, query: PollQueryDto) {
    const { skip, take, page, limit } = getPaginationParams(query);

    const where = { ownerId: userId };

    const [polls, total] = await Promise.all([
      this.prisma.poll.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, name: true } },
          _count: { select: { responses: true } },
        },
      }),
      this.prisma.poll.count({ where }),
    ]);

    const data = polls.map((poll) => ({
      id: poll.id,
      title: poll.title,
      slug: poll.slug,
      description: poll.description,
      visibility: poll.visibility,
      isActive: poll.isActive,
      expiresAt: poll.expiresAt,
      responseCount: poll._count.responses,
      owner: poll.owner,
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt,
    }));

    return { data, total, page, limit };
  }

  async findBySlug(slug: string, accessToken?: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { slug },
      include: POLL_INCLUDE,
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (poll.expiresAt && poll.expiresAt < new Date()) {
      throw new GoneException('Poll has expired');
    }

    if (poll.visibility === 'PRIVATE') {
      if (!accessToken || accessToken !== poll.accessToken) {
        throw new ForbiddenException('Access token required for private poll');
      }
    }

    return poll;
  }

  async create(userId: string, dto: CreatePollDto) {
    const slug = generateSlug(dto.title);

    const poll = await this.prisma.$transaction(async (tx) => {
      const created = await tx.poll.create({
        data: {
          title: dto.title,
          description: dto.description,
          slug,
          visibility: dto.visibility,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          ownerId: userId,
          questions: {
            create: dto.questions.map((q) => ({
              text: q.text,
              type: q.type,
              orderIndex: q.orderIndex,
              isRequired: q.isRequired,
              options: {
                create: q.options.map((o) => ({
                  text: o.text,
                  orderIndex: o.orderIndex,
                })),
              },
            })),
          },
        },
        include: POLL_INCLUDE,
      });
      return created;
    });

    return poll;
  }

  async update(slug: string, dto: UpdatePollDto) {
    const poll = await this.prisma.poll.findUnique({ where: { slug } });
    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    return this.prisma.poll.update({
      where: { slug },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.visibility !== undefined && { visibility: dto.visibility }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.expiresAt !== undefined && { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }),
      },
      include: POLL_INCLUDE,
    });
  }

  async delete(slug: string) {
    const poll = await this.prisma.poll.findUnique({ where: { slug } });
    if (!poll) {
      throw new NotFoundException('Poll not found');
    }
    await this.prisma.poll.delete({ where: { slug } });
  }

  async deleteById(id: string) {
    const poll = await this.prisma.poll.findUnique({ where: { id } });
    if (!poll) {
      throw new NotFoundException('Poll not found');
    }
    await this.prisma.poll.delete({ where: { id } });
  }

  async regenerateAccessToken(slug: string) {
    const poll = await this.prisma.poll.findUnique({ where: { slug } });
    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    const { randomUUID } = await import('crypto');
    const newToken = randomUUID();

    await this.prisma.poll.update({
      where: { slug },
      data: { accessToken: newToken },
    });

    return { accessToken: newToken };
  }

  async replaceQuestions(slug: string, dto: ReplaceQuestionsDto) {
    const poll = await this.prisma.poll.findUnique({ where: { slug } });
    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete all existing questions (cascades to options and answers)
      await tx.question.deleteMany({ where: { pollId: poll.id } });

      // Recreate questions and options
      for (const q of dto.questions) {
        await tx.question.create({
          data: {
            pollId: poll.id,
            text: q.text,
            type: q.type,
            orderIndex: q.orderIndex,
            isRequired: q.isRequired,
            options: {
              create: (q.options || []).map((o) => ({
                text: o.text,
                orderIndex: o.orderIndex,
              })),
            },
          },
        });
      }
    });

    return this.prisma.poll.findUnique({
      where: { slug },
      include: POLL_INCLUDE,
    });
  }

  async findAllAdmin(query: PollQueryDto) {
    const { skip, take, page, limit } = getPaginationParams(query);

    const [polls, total] = await Promise.all([
      this.prisma.poll.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, name: true } },
          _count: { select: { responses: true } },
        },
      }),
      this.prisma.poll.count(),
    ]);

    const data = polls.map((poll) => ({
      id: poll.id,
      title: poll.title,
      slug: poll.slug,
      description: poll.description,
      visibility: poll.visibility,
      isActive: poll.isActive,
      expiresAt: poll.expiresAt,
      responseCount: poll._count.responses,
      owner: poll.owner,
      createdAt: poll.createdAt,
    }));

    return { data, total, page, limit };
  }
}
