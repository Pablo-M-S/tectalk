import type { Exercise, ExerciseResult } from '@/api/types';
import { useBasicStats } from '@/lib/basic-stats';

export interface AnswerOutcome {
  correct: boolean;
  results: ExerciseResult[];
}

export interface ExerciseProps<T extends Exercise> {
  exercise: T;
  locked: boolean;
  /** Registra como corrigir a resposta atual; `null` desabilita o botão Verificar. */
  setEvaluator: (evaluate: (() => AnswerOutcome) | null) => void;
  /** Envia o resultado direto, para exercícios que se corrigem sozinhos. */
  submit: (outcome: AnswerOutcome) => void;
}

/**
 * Resultado de um exercício de um termo. Inglês básico mede o desempenho no aparelho
 * (para ajustar o foco) e não mexe no progresso do termo técnico.
 */
export function answerOutcome(exercise: Exercise, correct: boolean): AnswerOutcome {
  if ('basic' in exercise && exercise.basic) {
    useBasicStats.getState().record(correct);
    return { correct, results: [] };
  }
  return singleTerm(exercise, correct);
}

export function singleTerm(exercise: Exercise, correct: boolean): AnswerOutcome {
  return { correct, results: [{ termId: exercise.termIds[0], correct }] };
}
