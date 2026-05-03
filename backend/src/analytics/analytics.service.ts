import { Injectable, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { stringify } from 'csv-stringify';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(slug: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { slug },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    const totalResponses = await this.prisma.response.count({
      where: { pollId: poll.id },
    });

    // Responses over time grouped by day
    const responsesOverTimeRaw = await this.prisma.$queryRaw<
      { date: Date; count: bigint }[]
    >`
      SELECT DATE_TRUNC('day', submitted_at) as date, COUNT(*) as count
      FROM responses
      WHERE poll_id = ${poll.id}
      GROUP BY DATE_TRUNC('day', submitted_at)
      ORDER BY date ASC
    `;

    const responsesOverTime = responsesOverTimeRaw.map((r) => ({
      date: r.date.toISOString().split('T')[0],
      count: Number(r.count),
    }));

    // Per-question analytics
    const questions = await Promise.all(
      poll.questions.map(async (question) => {
        if (question.type === 'TEXT') {
          const textAnswers = await this.prisma.answer.findMany({
            where: { questionId: question.id, textValue: { not: null } },
            select: { textValue: true },
          });

          return {
            questionId: question.id,
            questionText: question.text,
            type: question.type,
            totalAnswers: textAnswers.length,
            textAnswers: textAnswers.map((a) => a.textValue).filter(Boolean),
          };
        } else {
          // SINGLE_CHOICE or MULTIPLE_CHOICE
          const totalAnswers = await this.prisma.answer.count({
            where: { questionId: question.id, optionId: { not: null } },
          });

          const optionCounts = await Promise.all(
            question.options.map(async (option) => {
              const count = await this.prisma.answer.count({
                where: { questionId: question.id, optionId: option.id },
              });
              return {
                optionId: option.id,
                text: option.text,
                count,
                percentage:
                  totalAnswers > 0
                    ? Math.round((count / totalAnswers) * 1000) / 10
                    : 0,
              };
            }),
          );

          return {
            questionId: question.id,
            questionText: question.text,
            type: question.type,
            totalAnswers,
            options: optionCounts,
          };
        }
      }),
    );

    return {
      totalResponses,
      responsesOverTime,
      questions,
    };
  }

  async exportCsv(slug: string, res: Response) {
    const poll = await this.prisma.poll.findUnique({
      where: { slug },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: { options: true },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    const responses = await this.prisma.response.findMany({
      where: { pollId: poll.id },
      orderBy: { submittedAt: 'asc' },
      include: {
        user: { select: { name: true } },
        answers: {
          include: {
            option: { select: { text: true } },
          },
        },
      },
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${slug}-results.csv"`,
    );

    const questionHeaders = poll.questions.map(
      (q, i) => `Q${i + 1}: ${q.text}`,
    );
    const headers = [
      'response_id',
      'submitted_at',
      'user_name',
      ...questionHeaders,
    ];

    const rows = responses.map((response) => {
      const questionAnswers = poll.questions.map((question) => {
        const answers = response.answers.filter(
          (a) => a.questionId === question.id,
        );
        if (answers.length === 0) return '';
        if (question.type === 'TEXT') {
          return answers[0]?.textValue || '';
        }
        return answers.map((a) => a.option?.text || '').join('; ');
      });

      return [
        response.id,
        response.submittedAt.toISOString(),
        response.user?.name || 'Anonymous',
        ...questionAnswers,
      ];
    });

    const stringifier = stringify({
      header: true,
      columns: headers,
    });

    stringifier.pipe(res);

    for (const row of rows) {
      stringifier.write(row);
    }

    stringifier.end();
  }
}
