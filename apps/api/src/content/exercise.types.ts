/**
 * Contrato de exercícios entregue ao app.
 *
 * Os campos de texto (`prompt`, `sentence`...) trazem apenas o CONTEÚDO.
 * As instruções ("Qual é o termo em inglês?") ficam no app, para
 * suportar vários idiomas de interface sem mexer na API.
 */
export const EXERCISE_TYPES = [
  'MULTIPLE_CHOICE',
  'MATCH_PAIRS',
  'TYPE_TERM',
  'FILL_BLANK',
  'BUILD_FROM_ROOTS',
  'LISTEN_AND_TYPE',
] as const;

export type ExerciseType = (typeof EXERCISE_TYPES)[number];

export interface Option {
  id: string;
  text: string;
}

/** Ponto de ensino exibido depois que o usuário responde. */
export interface Reveal {
  text: string;
  definition: string;
  ipa: string | null;
  informalForms: string[];
}

interface ExerciseBase<T extends ExerciseType> {
  id: string;
  type: T;
  termIds: string[];
  reveal?: Reveal;
}

export interface MultipleChoiceExercise extends ExerciseBase<'MULTIPLE_CHOICE'> {
  prompt: string;
  options: Option[];
  correctOptionId: string;
}

export interface MatchPairsExercise extends ExerciseBase<'MATCH_PAIRS'> {
  left: Option[];
  right: Option[];
}

export interface TypeTermExercise extends ExerciseBase<'TYPE_TERM'> {
  prompt: string;
  informalHint?: string;
  acceptedAnswers: string[];
}

export interface FillBlankExercise extends ExerciseBase<'FILL_BLANK'> {
  sentence: string;
  options: Option[];
  correctOptionId: string;
}

export interface BuildFromRootsExercise extends ExerciseBase<'BUILD_FROM_ROOTS'> {
  prompt: string;
  tiles: string[];
  solution: string[];
  breakdown: { segment: string; meaning: string }[];
}

export interface ListenAndTypeExercise extends ExerciseBase<'LISTEN_AND_TYPE'> {
  audioUrl: string;
  acceptedAnswers: string[];
}

export type Exercise =
  | MultipleChoiceExercise
  | MatchPairsExercise
  | TypeTermExercise
  | FillBlankExercise
  | BuildFromRootsExercise
  | ListenAndTypeExercise;
