import type { Exercise, ExerciseResult } from '@/api/types';

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

export function singleTerm(exercise: Exercise, correct: boolean): AnswerOutcome {
  return { correct, results: [{ termId: exercise.termIds[0], correct }] };
}
