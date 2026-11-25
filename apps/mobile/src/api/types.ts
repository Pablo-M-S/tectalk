export type Language = 'PT' | 'EN' | 'ES' | 'FR' | 'ZH' | 'JA' | 'DE';

export type ProficiencyLevel = 'BEGINNER' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';

export interface User {
  id: string;
  email: string;
  displayName: string;
  interfaceLanguage: Language;
  timezone: string;
  profession: string | null;
  targetLanguage: Language;
  level: ProficiencyLevel | null;
  dailyGoalMinutes: number | null;
  remindersEnabled: boolean;
  onboardedAt: string | null;
}

export interface ProfileUpdate {
  displayName?: string;
  profession?: string | null;
  targetLanguage?: Language;
  level?: ProficiencyLevel;
  dailyGoalMinutes?: number;
  remindersEnabled?: boolean;
  completeOnboarding?: boolean;
}

export interface Session {
  accessToken: string;
  user: User;
}

export interface TrackSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  profession: string;
  sourceLanguage: Language;
  targetLanguage: Language;
  lessonCount: number;
  completedCount: number;
  termCount: number;
}

export type LessonStatus = 'LOCKED' | 'AVAILABLE' | 'COMPLETED';

export interface LessonNode {
  id: string;
  slug: string;
  title: string;
  termCount: number;
  status: LessonStatus;
  bestScore: number | null;
}

export interface UnitNode {
  id: string;
  slug: string;
  title: string;
  lessons: LessonNode[];
}

export interface TrackDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  units: UnitNode[];
}

export interface Stats {
  xp: number;
  currentStreak: number;
  longestStreak: number;
  practicedToday?: boolean;
}

export interface Option {
  id: string;
  text: string;
}

export interface Translation {
  language: Language;
  text: string;
  reading: string | null;
}

export interface Reveal {
  text: string;
  definition: string;
  ipa: string | null;
  informalForms: string[];
  usageNote: string | null;
  collocations: string[];
  example: string | null;
  translations?: Translation[];
}

interface Base {
  id: string;
  termIds: string[];
  reveal?: Reveal;
}

export interface MultipleChoiceExercise extends Base {
  type: 'MULTIPLE_CHOICE';
  prompt: string;
  options: Option[];
  correctOptionId: string;
}

export interface MatchPairsExercise extends Base {
  type: 'MATCH_PAIRS';
  left: Option[];
  right: Option[];
}

export interface TypeTermExercise extends Base {
  type: 'TYPE_TERM';
  prompt: string;
  informalHint?: string;
  acceptedAnswers: string[];
}

export interface FillBlankExercise extends Base {
  type: 'FILL_BLANK';
  sentence: string;
  options: Option[];
  correctOptionId: string;
}

export interface BuildFromRootsExercise extends Base {
  type: 'BUILD_FROM_ROOTS';
  prompt: string;
  tiles: string[];
  solution: string[];
  breakdown: { segment: string; meaning: string }[];
}

export interface RegisterChoiceExercise extends Base {
  type: 'REGISTER_CHOICE';
  prompt: string;
  options: Option[];
  correctOptionId: string;
}

export interface OrderSentenceExercise extends Base {
  type: 'ORDER_SENTENCE';
  prompt: string;
  tiles: string[];
  solution: string[];
}

export interface FillBlanksExercise extends Base {
  type: 'FILL_BLANKS';
  sentences: { id: string; before: string; after: string }[];
  tiles: Option[];
}

export interface ListenAndTypeExercise extends Base {
  type: 'LISTEN_AND_TYPE';
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

export interface LessonSession {
  lesson: { id: string; title: string };
  exercises: Exercise[];
}

export interface PracticeSession {
  studiedCount: number;
  exercises: Exercise[];
}

export interface DueResponse {
  dueCount: number;
  exercises: Exercise[];
}

export interface ExerciseResult {
  termId: string;
  correct: boolean;
}

export interface CompleteResponse {
  score: number;
  correct: number;
  total: number;
  xpEarned: number;
  stats: Stats;
}

export interface ReviewResponse {
  correct: number;
  total: number;
  xpEarned: number;
  stats: Stats;
}
