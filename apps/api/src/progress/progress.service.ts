import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExerciseResult } from '../review/review.schemas';
import { ReviewService } from '../review/review.service';
import { StatsService } from '../stats/stats.service';

const BASE_XP = 10;
const PERFECT_BONUS = 5;

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviews: ReviewService,
    private readonly stats: StatsService,
  ) {}

  async completeLesson(userId: string, lessonId: string, submitted: ExerciseResult[]) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, status: 'PUBLISHED' },
      select: {
        id: true,
        unit: { select: { trackId: true } },
        terms: { select: { termId: true } },
      },
    });
    if (!lesson) throw new NotFoundException('Lição não encontrada');

    const allowed = new Set(lesson.terms.map((t) => t.termId));
    const results = submitted.filter((r) => allowed.has(r.termId));
    if (results.length === 0) {
      throw new BadRequestException('Nenhum resultado válido para esta lição');
    }

    const correct = results.filter((r) => r.correct).length;
    const score = correct / results.length;
    const xpEarned = BASE_XP + correct + (score === 1 ? PERFECT_BONUS : 0);
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      await this.reviews.applyResults(tx, {
        userId,
        trackId: lesson.unit.trackId,
        results,
        now,
      });
      await tx.lessonCompletion.create({ data: { userId, lessonId, score, xpEarned } });
      const stats = await this.stats.registerActivity(tx, userId, xpEarned, now);
      return { score, correct, total: results.length, xpEarned, stats };
    });
  }
}
