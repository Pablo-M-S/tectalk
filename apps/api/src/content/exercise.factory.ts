import { randomUUID } from 'node:crypto';
import {
  BuildFromRootsExercise,
  Exercise,
  FillBlankExercise,
  ListenAndTypeExercise,
  MatchPairsExercise,
  MultipleChoiceExercise,
  OrderSentenceExercise,
  RegisterChoiceExercise,
  Reveal,
  TypeTermExercise,
} from './exercise.types';

export interface LocaleView {
  text: string;
  definition: string;
  informalForms: string[];
  ipa: string | null;
  usageNote: string | null;
  collocations: string[];
  audioUrl: string | null;
  audioReady: boolean;
}

export interface ExampleView {
  sentence: string;
  answer: string;
}

export interface TermView {
  id: string;
  source: LocaleView;
  target: LocaleView;
  examples: ExampleView[];
  parts: { segment: string; meaning: string }[];
}

export interface LessonSessionInput {
  terms: TermView[];
  pool: TermView[];
  audioEnabled: boolean;
}

export interface PracticeSessionInput extends LessonSessionInput {
  size?: number;
}

const MAX_EXERCISES = 20;
const MATCH_SIZE = 5;
const PRACTICE_SIZE = 12;
const MIN_SENTENCE_WORDS = 4;
const MAX_SENTENCE_WORDS = 14;
const BLANK = '_____';

const present = <T>(value: T | null | undefined): value is T => value != null;

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

  private reveal(term: TermView, example: ExampleView | null = term.examples[0] ?? null): Reveal {
    return {
      text: term.target.text,
      definition: term.target.definition,
      ipa: term.target.ipa,
      informalForms: term.target.informalForms,
      usageNote: term.target.usageNote,
      collocations: term.target.collocations,
      example: example ? example.sentence : null,
    };
  }

  private usableExamples(term: TermView): ExampleView[] {
    return term.examples.filter((e) => e.sentence.includes(e.answer));
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
      reveal: this.reveal(term),
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
      reveal: this.reveal(term),
    };
  }

  fillBlank(term: TermView, pool: TermView[]): FillBlankExercise | null {
    const [example] = this.pick(this.usableExamples(term), 1);
    if (!example) return null;
    const distractors = this.distractors(term, pool, 3);
    if (distractors.length === 0) return null;

    return {
      id: randomUUID(),
      type: 'FILL_BLANK',
      termIds: [term.id],
      sentence: example.sentence.replace(example.answer, BLANK),
      options: this.shuffle(
        [term, ...distractors].map((t) => ({ id: t.id, text: t.target.text })),
      ),
      correctOptionId: term.id,
      reveal: this.reveal(term, example),
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
      reveal: this.reveal(term),
    };
  }

  /** "Como você diria isso num documento formal?" — ensina registro, não só vocabulário. */
  registerChoice(term: TermView, pool: TermView[]): RegisterChoiceExercise | null {
    const informal = term.target.informalForms[0];
    if (!informal) return null;
    const distractors = this.distractors(term, pool, 3);
    if (distractors.length === 0) return null;

    return {
      id: randomUUID(),
      type: 'REGISTER_CHOICE',
      termIds: [term.id],
      prompt: informal,
      options: this.shuffle(
        [term, ...distractors].map((t) => ({ id: t.id, text: t.target.text })),
      ),
      correctOptionId: term.id,
      reveal: this.reveal(term),
    };
  }

  /** Monta uma frase profissional real a partir das palavras embaralhadas. */
  orderSentence(term: TermView): OrderSentenceExercise | null {
    const candidates = this.usableExamples(term).filter((e) => {
      const words = e.sentence.split(/\s+/).length;
      return words >= MIN_SENTENCE_WORDS && words <= MAX_SENTENCE_WORDS;
    });
    const [example] = this.pick(candidates, 1);
    if (!example) return null;

    const solution = example.sentence.split(/\s+/);
    let tiles = this.shuffle(solution);
    if (tiles.join(' ') === solution.join(' ')) tiles = [...tiles].reverse();

    return {
      id: randomUUID(),
      type: 'ORDER_SENTENCE',
      termIds: [term.id],
      prompt: term.source.text,
      tiles,
      solution,
      reveal: this.reveal(term, example),
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
      reveal: this.reveal(term),
    };
  }

  /** Sessão de lição: reconhecimento, associação e depois produção ativa. */
  buildLessonSession({ terms, pool, audioEnabled }: LessonSessionInput): Exercise[] {
    const segmentPool = this.segmentPool(pool);

    const recognition = this.shuffle(terms)
      .map((t) => this.multipleChoice(t, pool))
      .filter(present);

    const matching = [this.matchPairs(terms)].filter(present);

    const production = this.shuffle(
      terms.flatMap((t) => [
        this.typeTerm(t),
        this.fillBlank(t, pool),
        this.buildFromRoots(t, segmentPool),
        this.registerChoice(t, pool),
        this.orderSentence(t),
        audioEnabled ? this.listenAndType(t) : null,
      ]),
    ).filter(present);

    const budget = Math.max(0, MAX_EXERCISES - recognition.length - matching.length);
    return [...recognition, ...matching, ...production.slice(0, budget)].slice(0, MAX_EXERCISES);
  }

  /**
   * Prática livre: termos já estudados, um exercício aleatório de tipo variado
   * por termo. Cada chamada gera uma sessão diferente.
   */
  buildPracticeSession({
    terms,
    pool,
    audioEnabled,
    size = PRACTICE_SIZE,
  }: PracticeSessionInput): Exercise[] {
    const segmentPool = this.segmentPool(pool);
    const exercises: Exercise[] = [];
    const usage = new Map<string, number>();

    for (const term of this.pick(terms, size)) {
      const options: Exercise[] = [
        this.multipleChoice(term, pool),
        this.typeTerm(term),
        this.fillBlank(term, pool),
        this.buildFromRoots(term, segmentPool),
        this.registerChoice(term, pool),
        this.orderSentence(term),
        audioEnabled ? this.listenAndType(term) : null,
      ].filter(present);

      // Prefere o tipo menos usado até aqui, para a sessão não ficar repetitiva.
      const least = Math.min(...options.map((e) => usage.get(e.type) ?? 0));
      const [chosen] = this.pick(
        options.filter((e) => (usage.get(e.type) ?? 0) === least),
        1,
      );
      usage.set(chosen.type, (usage.get(chosen.type) ?? 0) + 1);
      exercises.push(chosen);
    }

    const matching = terms.length >= 4 ? this.matchPairs(terms) : null;
    return matching ? this.shuffle([...exercises, matching]) : exercises;
  }

  private segmentPool(pool: TermView[]): string[] {
    return [...new Set(pool.flatMap((t) => t.parts.map((p) => p.segment)))];
  }

  private distractors(term: TermView, pool: TermView[], count: number): TermView[] {
    return this.pick(
      pool.filter((t) => t.id !== term.id && t.target.text !== term.target.text),
      count,
    );
  }
}
