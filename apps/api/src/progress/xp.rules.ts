import { ExerciseResult } from '../review/review.schemas';

export const BASE_XP = 10;
export const PERFECT_BONUS = 5;
/** Refazer uma lição já concluída rende só uma parte do XP. */
export const REPEAT_FACTOR = 0.25;
export const XP_PER_CORRECT_REVIEW = 2;

/** Um resultado por termo: só conta como acerto quem acertou em todas as tentativas. */
export function uniqueResults(results: ExerciseResult[]): ExerciseResult[] {
  const byTerm = new Map<string, boolean>();
  for (const { termId, correct } of results) {
    byTerm.set(termId, (byTerm.get(termId) ?? true) && correct);
  }
  return [...byTerm].map(([termId, correct]) => ({ termId, correct }));
}

export function lessonXp(correct: number, score: number, previousCompletions: number): number {
  const full = BASE_XP + correct + (score === 1 ? PERFECT_BONUS : 0);
  return previousCompletions > 0 ? Math.max(1, Math.ceil(full * REPEAT_FACTOR)) : full;
}
