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
  'REGISTER_CHOICE',
  'ORDER_SENTENCE',
  'FILL_BLANKS',
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
  /** Como o termo é usado: registro, contexto, armadilhas (no idioma de origem). */
  usageNote: string | null;
  collocations: string[];
  /** Frase real de uso, quando existir. */
  example: string | null;
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

/** Troca de registro: de uma expressão coloquial para o termo formal de documentos. */
export interface RegisterChoiceExercise extends ExerciseBase<'REGISTER_CHOICE'> {
  prompt: string;
  options: Option[];
  correctOptionId: string;
}

/** Monta uma frase profissional real, palavra por palavra. */
export interface OrderSentenceExercise extends ExerciseBase<'ORDER_SENTENCE'> {
  prompt: string;
  tiles: string[];
  solution: string[];
}

/**
 * Completar frases: cada frase tem uma lacuna e o banco de palavras traz os termos.
 * O `id` de cada frase é o id do termo que a completa, e o mesmo id está no tile correto.
 */
export interface FillBlanksExercise extends ExerciseBase<'FILL_BLANKS'> {
  sentences: { id: string; before: string; after: string }[];
  tiles: Option[];
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
  | RegisterChoiceExercise
  | OrderSentenceExercise
  | FillBlanksExercise
  | ListenAndTypeExercise;
