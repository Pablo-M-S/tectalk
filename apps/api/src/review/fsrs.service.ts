import { Injectable } from '@nestjs/common';
import { Prisma, ReviewCard } from '@prisma/client';
import { Card, createEmptyCard, fsrs, generatorParameters, Grade, State } from 'ts-fsrs';

export type ReviewCardState = Pick<
  ReviewCard,
  | 'due'
  | 'stability'
  | 'difficulty'
  | 'elapsedDays'
  | 'scheduledDays'
  | 'reps'
  | 'lapses'
  | 'state'
  | 'lastReview'
>;

/** Agendamento de revisões com FSRS, a partir do estado salvo no banco. */
@Injectable()
export class FsrsService {
  private readonly scheduler = fsrs(generatorParameters({ enable_fuzz: true }));

  schedule(
    current: ReviewCardState | null,
    grade: Grade,
    now: Date,
  ): Omit<Prisma.ReviewCardUncheckedCreateInput, 'userId' | 'termId' | 'trackId'> {
    const card = current ? this.toCard(current) : createEmptyCard(now);
    const { card: next } = this.scheduler.next(card, now, grade);

    return {
      due: next.due,
      stability: next.stability,
      difficulty: next.difficulty,
      elapsedDays: next.elapsed_days,
      scheduledDays: next.scheduled_days,
      reps: next.reps,
      lapses: next.lapses,
      state: next.state,
      lastReview: next.last_review ?? now,
    };
  }

  private toCard(row: ReviewCardState): Card {
    return {
      due: row.due,
      stability: row.stability,
      difficulty: row.difficulty,
      elapsed_days: row.elapsedDays,
      scheduled_days: row.scheduledDays,
      reps: row.reps,
      lapses: row.lapses,
      state: row.state as State,
      last_review: row.lastReview ?? undefined,
    };
  }
}
