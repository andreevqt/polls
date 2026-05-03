import {
  Injectable,
  NotFoundException,
  ConflictException,
  GoneException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { getPaginationParams } from '../common/utils/pagination';

@Injectable()
export class ResponsesService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(
    slug: string,
    dto: SubmitResponseDto,
    userId?: string,
    fingerprint?: string,
  ) {
    const poll = await this.prisma.poll.findUnique({
      where: { slug },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (!poll.isActive) {
      throw new GoneException('Poll is not active');
    }

    if (poll.expiresAt && poll.expiresAt < new Date()) {
      throw new GoneException('Poll has expired');
    }

    // Deduplication for authenticated users
    if (userId) {
      const existing = await this.prisma.response.findUnique({
        where: { pollId_userId: { pollId: poll.id, userId } },
      });
      if (existing) {
        throw new ConflictException('You have already responded to this poll');
      }
    } else if (fingerprint) {
      // Soft deduplication for anonymous users
      const existing = await this.prisma.response.findFirst({
        where: { pollId: poll.id, respondentFingerprint: fingerprint },
      });
      if (existing) {
        throw new ConflictException('You have already responded to this poll');
      }
    }

    // Validate required questions are answered
    const requiredQuestions = poll.questions.filter((q) => q.isRequired);
    for (const question of requiredQuestions) {
      const answer = dto.answers.find((a) => a.questionId === question.id);
      if (!answer) {
        throw new BadRequestException(
          `Required question "${question.text}" is not answered`,
        );
      }
      if (question.type === 'MULTIPLE_CHOICE') {
        if (!answer.optionIds || answer.optionIds.length === 0) {
          throw new BadRequestException(
            `Required question "${question.text}" requires at least one option selection`,
          );
        }
      } else if (question.type === 'SINGLE_CHOICE') {
        if (!answer.optionId) {
          throw new BadRequestException(
            `Required question "${question.text}" requires an option selection`,
          );
        }
      } else if (question.type === 'TEXT') {
        if (!answer.textValue) {
          throw new BadRequestException(
            `Required question "${question.text}" requires a text answer`,
          );
        }
      }
    }

    // Create response with answers in a transaction
    const response = await this.prisma.$transaction(async (tx) => {
      const created = await tx.response.create({
        data: {
          pollId: poll.id,
          userId: userId || null,
          respondentFingerprint: fingerprint || dto.respondentFingerprint || null,
          answers: {
            create: dto.answers.flatMap((a) => {
              // MULTIPLE_CHOICE: one Answer record per selected optionId
              if (a.optionIds && a.optionIds.length > 0) {
                return a.optionIds.map((optionId) => ({
                  questionId: a.questionId,
                  optionId,
                  textValue: null,
                }));
              }
              // SINGLE_CHOICE or TEXT
              return [{
                questionId: a.questionId,
                optionId: a.optionId || null,
                textValue: a.textValue || null,
              }];
            }),
          },
        },
      });
      return created;
    });

    return { id: response.id, submittedAt: response.submittedAt };
  }

  async findByPoll(slug: string, query: { page?: number; limit?: number }) {
    const poll = await this.prisma.poll.findUnique({ where: { slug } });
    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    const { skip, take, page, limit } = getPaginationParams(query);

    const [responses, total] = await Promise.all([
      this.prisma.response.findMany({
        where: { pollId: poll.id },
        skip,
        take,
        orderBy: { submittedAt: 'desc' },
        include: {
          user: { select: { id: true, name: true } },
          answers: {
            select: {
              questionId: true,
              optionId: true,
              textValue: true,
            },
          },
        },
      }),
      this.prisma.response.count({ where: { pollId: poll.id } }),
    ]);

    return { data: responses, total, page, limit };
  }
}
