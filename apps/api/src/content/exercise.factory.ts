import { randomUUID } from 'node:crypto';
import {
  BuildFromRootsExercise,
  Exercise,
  FillBlankExercise,
  ListenAndTypeExercise,
  MatchPairsExercise,
  MultipleChoiceExercise,
  Reveal,
  TypeTermExercise,
} from './exercise.types';

export interface LocaleView {
  text: string;
  definition: string;
  informalForms: string[];
  ipa: string | null;
  audioUrl: string | null;
  audioReady: boolean;
}

export interface TermView {
  id: string;
  source: LocaleView;
  target: LocaleView;
  example: { sentence: string; answer: string } | null;
  parts: { segment: string; meaning: string }[];
}

export interface LessonSessionInput {
  terms: TermView[];
  pool: TermView[];
  audioEnabled: boolean;
}

const MAX_EXERCISES = 20;
const MATCH_SIZE = 5;
const BLANK = '_____';

const present = <T>(value: T | null | undefined): value is T => value != null;

const reveal = (term: TermView): Reveal => ({
  text: term.target.text,
  definition: term.target.definition,
  ipa: term.target.ipa,
  informalForms: term.target.informalForms,
});

/**
 * Gera exercícios a partir dos termos já cadastrados. Nenhum exercício é
 * escrito à mão: o conteúdo é só o dicionário, e a variedade vem daqui.
 */
export class ExerciseFactory {
  constructor(private readonly rng: () => number = Math.random) {}

  shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  pick<T>(items: readonly T[], count: number): T[] {
    return this.shuffle(items).slice(0, count);
  }

  multipleChoice(term: TermView, pool: TermView[]): MultipleChoiceExercise | null {
    const distractors = this.distractors(term, pool, 3);
    if (distractors.length === 0) return null;

    return {
      id: randomUUID(),
      type: 'MULTIPLE_CHOICE',
      termIds: [term.id],
      prompt: term.source.text,
      options: this.shuffle(
        [term, ...distractors].map((t) => ({ id: t.id, text: t.target.text })),
      ),
      correctOptionId: term.id,
      reveal: reveal(term),
    };
  }

  matchPairs(terms: TermView[]): MatchPairsExercise | null {
    if (terms.length < 2) return null;
    const chosen = this.pick(terms, MATCH_SIZE);

    return {
      id: randomUUID(),
      type: 'MATCH_PAIRS',
      termIds: chosen.map((t) => t.id),
      left: this.shuffle(chosen.map((t) => ({ id: t.id, text: t.source.text }))),
      right: this.shuffle(chosen.map((t) => ({ id: t.id, text: t.target.text }))),
    };
  }

  typeTerm(term: TermView): TypeTermExercise {
    return {
      id: randomUUID(),
      type: 'TYPE_TERM',
      termIds: [term.id],
      prompt: term.source.definition,
      informalHint: term.target.informalForms[0],
      acceptedAnswers: [term.target.text],
      reveal: reveal(term),
    };
  }

  fillBlank(term: TermView, pool: TermView[]): FillBlankExercise | null {
    if (!term.example || !term.example.sentence.includes(term.example.answer)) return null;
    const distractors = this.distractors(term, pool, 3);
    if (distractors.length === 0) return null;

    return {
      id: randomUUID(),
      type: 'FILL_BLANK',
      termIds: [term.id],
      sentence: term.example.sentence.replace(term.example.answer, BLANK),
      options: this.shuffle(
        [term, ...distractors].map((t) => ({ id: t.id, text: t.target.text })),
      ),
      correctOptionId: term.id,
      reveal: reveal(term),
    };
  }

  buildFromRoots(term: TermView, segmentPool: string[]): BuildFromRootsExercise | null {
    if (term.parts.length < 2) return null;
    const solution = term.parts.map((p) => p.segment);
    const extras = this.pick(
      segmentPool.filter((segment) => !solution.includes(segment)),
      3,
    );

    return {
      id: randomUUID(),
      type: 'BUILD_FROM_ROOTS',
      termIds: [term.id],
      prompt: term.source.text,
      tiles: this.shuffle([...solution, ...extras]),
      solution,
      breakdown: term.parts,
      reveal: reveal(term),
    };
  }

  listenAndType(term: TermView): ListenAndTypeExercise | null {
    if (!term.target.audioReady || !term.target.audioUrl) return null;
    return {
      id: randomUUID(),
      type: 'LISTEN_AND_TYPE',
      termIds: [term.id],
      audioUrl: term.target.audioUrl,
      acceptedAnswers: [term.target.text],
      reveal: reveal(term),
    };
  }

  /** Sessão de lição: reconhecimento, associação e depois produção ativa. */
  buildLessonSession({ terms, pool, audioEnabled }: LessonSessionInput): Exercise[] {
    const segmentPool = [...new Set(pool.flatMap((t) => t.parts.map((p) => p.segment)))];

    const recognition = this.shuffle(terms)
      .map((t) => this.multipleChoice(t, pool))
      .filter(present);

    const matching = [this.matchPairs(terms)].filter(present);

    const production = this.shuffle(
      terms.flatMap((t) => [
        this.typeTerm(t),
        this.fillBlank(t, pool),
        this.buildFromRoots(t, segmentPool),
        audioEnabled ? this.listenAndType(t) : null,
      ]),
    ).filter(present);

    const budget = Math.max(0, MAX_EXERCISES - recognition.length - matching.length);
    return [...recognition, ...matching, ...production.slice(0, budget)].slice(0, MAX_EXERCISES);
  }

  private distractors(term: TermView, pool: TermView[], count: number): TermView[] {
    return this.pick(
      pool.filter((t) => t.id !== term.id && t.target.text !== term.target.text),
      count,
    );
  }
}
