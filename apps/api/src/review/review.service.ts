import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Grade, Rating } from 'ts-fsrs';
import { ExerciseService } from '../content/exercise.service';
import { PrismaService } from '../prisma/prisma.service';
import { StatsService } from '../stats/stats.service';
import { FsrsService } from './fsrs.service';
import { uniqueResults, XP_PER_CORRECT_REVIEW } from '../progress/xp.rules';
import { ExerciseResult } from './review.schemas';

interface ApplyParams {
  userId: string;
  trackId: string;
  results: ExerciseResult[];
  now: Date;
}

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fsrs: FsrsService,
    private readonly exercises: ExerciseService,
    private readonly stats: StatsService,
  ) {}

  async due(userId: string, trackSlug: string, limit: number) {
    const track = await this.requireTrack(trackSlug);
    const where = { userId, trackId: track.id, due: { lte: new Date() } };

    const [dueCount, cards] = await Promise.all([
      this.prisma.reviewCard.count({ where }),
      this.prisma.reviewCard.findMany({
        where,
        orderBy: { due: 'asc' },
        take: limit,
        select: { termId: true, reps: true },
      }),
    ]);

    return { dueCount, exercises: await this.exercises.buildReviewSession(track, cards) };
  }

  async submit(userId: string, trackSlug: string, results: ExerciseResult[]) {
    const track = await this.requireTrack(trackSlug);

    const knownTerms = await this.prisma.term.findMany({
      where: { id: { in: results.map((r) => r.termId) }, domain: track.profession },
      select: { id: true },
    });
    const known = new Set(knownTerms.map((t) => t.id));
    const valid = uniqueResults(results.filter((r) => known.has(r.termId)));
    if (valid.length === 0) {
      throw new BadRequestException('Nenhum resultado válido para esta trilha');
    }

    const now = new Date();
    const correct = valid.filter((r) => r.correct).length;
    const xpEarned = correct * XP_PER_CORRECT_REVIEW;

    return this.prisma.$transaction(async (tx) => {
      await this.applyResults(tx, { userId, trackId: track.id, results: valid, now });
      const stats = await this.stats.registerActivity(tx, userId, xpEarned, now);
      return { correct, total: valid.length, xpEarned, stats };
    });
  }

  /**
   * Atualiza os cartões FSRS. Um termo com qualquer erro na sessão conta
   * como "Again"; só acertos contam como "Good".
   */
  async applyResults(tx: Prisma.TransactionClient, params: ApplyParams): Promise<void> {
    const { userId, trackId, results, now } = params;

    const allCorrect = new Map<string, boolean>();
    for (const result of results) {
      allCorrect.set(result.termId, (allCorrect.get(result.termId) ?? true) && result.correct);
    }

    const termIds = [...allCorrect.keys()];
    const existing = await tx.reviewCard.findMany({
      where: { userId, trackId, termId: { in: termIds } },
    });
    const byTerm = new Map(existing.map((card) => [card.termId, card]));

    for (const termId of termIds) {
      const grade: Grade = allCorrect.get(termId) ? Rating.Good : Rating.Again;
      const data = this.fsrs.schedule(byTerm.get(termId) ?? null, grade, now);
      await tx.reviewCard.upsert({
        where: { userId_termId_trackId: { userId, termId, trackId } },
        create: { userId, termId, trackId, ...data },
        update: data,
      });
    }
  }

  private async requireTrack(slug: string) {
    const track = await this.prisma.track.findFirst({ where: { slug, status: 'PUBLISHED' } });
    if (!track) throw new NotFoundException('Trilha não encontrada');
    return track;
  }
}
