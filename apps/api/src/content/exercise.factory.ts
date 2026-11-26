import { randomUUID } from 'node:crypto';
import { BASIC_WORDS, BasicWord, Level, meaningsClash, sentenceDistractors } from './basic-english';
import {
  BuildFromRootsExercise,
  Exercise,
  FillBlankExercise,
  FillBlanksExercise,
  ListenAndTypeExercise,
  MatchPairsExercise,
  MultipleChoiceExercise,
  OrderSentenceExercise,
  RegisterChoiceExercise,
  Reveal,
  Translation,
  TypeTermExercise,
} from './exercise.types';

export interface LocaleView {
  text: string;
  definition: string;
  informalForms: string[];
  ipa: string | null;
  romanization: string | null;
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
  /** Outros idiomas disponíveis para o termo, além do par estudado. */
  others?: Translation[];
}

export interface LessonSessionInput {
  terms: TermView[];
  pool: TermView[];
  audioEnabled: boolean;
  /**
   * Parte da sessão dedicada ao termo técnico (0 a 1). O restante é inglês básico em frases
   * com o termo técnico. Sem valor, ou com 1, a sessão é só de termos técnicos.
   */
  technicalShare?: number;
  /** Nível informado pelo usuário; define o tamanho das frases a montar. */
  level?: Level | null;
}

export interface PracticeSessionInput extends LessonSessionInput {
  size?: number;
}

const MAX_EXERCISES = 20;
const MATCH_SIZE = 5;
const PRACTICE_SIZE = 12;
const MIN_SENTENCE_WORDS = 4;
const MAX_SENTENCE_WORDS = 14;
const BASIC_SENTENCE_WORDS = 7;
const BLANK = '_____';
const BLANKS_SIZE = 3;
const LESSON_WITH_BASICS = 24;
const PRACTICE_WITH_BASICS = 16;

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
      romanization: term.target.romanization,
      translation: term.source.text,
      informalForms: term.target.informalForms,
      usageNote: term.target.usageNote,
      collocations: term.target.collocations,
      example: example ? example.sentence : null,
      translations: term.others ?? [],
    };
  }

  /**
   * Texto de uma opção. Em idiomas sem alfabeto latino, a leitura (hiragana, pinyin)
   * e o romaji vêm abaixo, para o aluno aprender a forma correta. Nunca repete o
   * que já está no outro lado (nos alfabetos, o romaji é a própria pergunta).
   */
  private label(locale: LocaleView, other: LocaleView): string {
    const reading = locale.ipa && !locale.ipa.startsWith('/') ? locale.ipa : null;
    const extras = [reading, locale.romanization].filter(
      (extra): extra is string => Boolean(extra) && extra !== locale.text && extra !== other.text,
    );
    return extras.length > 0 ? `${locale.text}\n${extras.join(' · ')}` : locale.text;
  }

  private hasReading(term: TermView): boolean {
    return Boolean(term.target.romanization) || Boolean(term.target.ipa && !term.target.ipa.startsWith('/'));
  }

  /** Nos alfabetos, a definição entregaria a resposta; só vale digitar palavras. */
  private canType(term: TermView): boolean {
    return term.source.text !== term.target.romanization;
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
        [term, ...distractors].map((t) => ({ id: t.id, text: this.label(t.target, t.source) })),
      ),
      correctOptionId: term.id,
      direction: 'FORWARD',
      alphabet: !this.canType(term),
      reveal: this.reveal(term),
    };
  }

  /** Vê o termo no idioma estudado e escolhe o significado. Só onde há leitura a aprender. */
  reverseChoice(term: TermView, pool: TermView[]): MultipleChoiceExercise | null {
    if (!this.hasReading(term)) return null;
    const distractors = this.distractors(term, pool, 3).filter((t) => t.source.text !== term.source.text);
    if (distractors.length === 0) return null;

    return {
      id: randomUUID(),
      type: 'MULTIPLE_CHOICE',
      termIds: [term.id],
      prompt: this.label(term.target, term.source),
      options: this.shuffle([term, ...distractors].map((t) => ({ id: t.id, text: t.source.text }))),
      correctOptionId: term.id,
      direction: 'REVERSE',
      alphabet: !this.canType(term),
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
      right: this.shuffle(chosen.map((t) => ({ id: t.id, text: this.label(t.target, t.source) }))),
    };
  }

  typeTerm(term: TermView): TypeTermExercise {
    return {
      id: randomUUID(),
      type: 'TYPE_TERM',
      termIds: [term.id],
      prompt: term.source.definition,
      informalHint: term.target.informalForms[0],
      acceptedAnswers: this.acceptedAnswers(term),
      reveal: this.reveal(term),
    };
  }

  /** O termo e, em idiomas sem teclado latino, a leitura (hiragana, pinyin). IPA não entra. */
  private acceptedAnswers(term: TermView): string[] {
    const reading = term.target.ipa;
    const accepted = [term.target.text];
    if (reading && !reading.startsWith('/')) accepted.push(reading);
    const romaji = term.target.romanization;
    if (romaji) {
      // "ou" e "uu" também podem ser digitados curtos: kōkyū = kokyuu = kokyu.
      accepted.push(romaji, romaji.replace(/ou/g, 'o').replace(/uu/g, 'u'));
    }
    return [...new Set(accepted)];
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
  orderSentence(term: TermView, level?: Level | null): OrderSentenceExercise | null {
    // Iniciante só monta com palavras que acabou de ver: as do próprio termo (2 a 4 palavras).
    // Frases de exemplo trazem vocabulário que ele ainda não conhece.
    if (level === 'BEGINNER') return this.orderTermWords(term);

    const maxWords = level === 'BASIC' ? BASIC_SENTENCE_WORDS : MAX_SENTENCE_WORDS;
    const candidates = this.usableExamples(term).filter((e) => {
      const words = e.sentence.split(/\s+/).length;
      return words >= MIN_SENTENCE_WORDS && words <= maxWords;
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

  /** Iniciante: ordena as palavras do próprio termo (só existe se o termo tiver 2 a 4 palavras). */
  private orderTermWords(term: TermView): OrderSentenceExercise | null {
    const solution = term.target.text.trim().split(/\s+/);
    if (solution.length < 2 || solution.length > 4) return null;
    let tiles = this.shuffle(solution);
    if (tiles.join(' ') === solution.join(' ')) tiles = [...tiles].reverse();
    return {
      id: randomUUID(),
      type: 'ORDER_SENTENCE',
      termIds: [term.id],
      prompt: term.source.text,
      tiles,
      solution,
      reveal: this.reveal(term),
    };
  }

  /** Completar frases com um banco de palavras: cada termo volta ao seu contexto de uso. */
  fillBlanks(terms: TermView[], size = BLANKS_SIZE): FillBlanksExercise | null {
    const seen = new Set<string>();
    const picked: { term: TermView; example: ExampleView }[] = [];
    for (const term of this.shuffle(terms)) {
      const [example] = this.pick(this.usableExamples(term), 1);
      if (!example || seen.has(term.target.text)) continue;
      seen.add(term.target.text);
      picked.push({ term, example });
      if (picked.length === size) break;
    }
    if (picked.length < 2) return null;

    const sentences = picked.map(({ term, example }) => {
      const at = example.sentence.indexOf(example.answer);
      return {
        id: term.id,
        before: example.sentence.slice(0, at),
        after: example.sentence.slice(at + example.answer.length),
      };
    });
    const tiles = picked.map(({ term }) => ({ id: term.id, text: term.target.text }));
    let shuffled = this.shuffle(tiles);
    if (shuffled.every((tile, index) => tile.id === tiles[index].id)) shuffled = [...shuffled].reverse();

    return {
      id: randomUUID(),
      type: 'FILL_BLANKS',
      termIds: picked.map(({ term }) => term.id),
      sentences,
      tiles: shuffled,
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
  buildLessonSession({ terms, pool, audioEnabled, technicalShare = 1, level }: LessonSessionInput): Exercise[] {
    const technical = this.technicalLesson({ terms, pool, audioEnabled, level });
    return this.withBasicEnglish(technical, terms, technicalShare, LESSON_WITH_BASICS);
  }

  private technicalLesson({ terms, pool, audioEnabled, level }: LessonSessionInput): Exercise[] {
    const segmentPool = this.segmentPool(pool);

    const recognition = [
      ...this.shuffle(terms).map((t) => this.multipleChoice(t, pool)),
      ...this.shuffle(terms).map((t) => this.reverseChoice(t, pool)),
    ].filter(present);

    const matching = [this.matchPairs(terms), this.fillBlanks(terms)].filter(present);

    const production = this.shuffle(
      terms.flatMap((t) => [
        this.canType(t) ? this.typeTerm(t) : null,
        this.fillBlank(t, pool),
        this.buildFromRoots(t, segmentPool),
        this.registerChoice(t, pool),
        this.orderSentence(t, level),
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
    technicalShare = 1,
    level,
  }: PracticeSessionInput): Exercise[] {
    const technical = this.technicalPractice({ terms, pool, audioEnabled, size, level });
    return this.withBasicEnglish(technical, terms, technicalShare, PRACTICE_WITH_BASICS);
  }

  private technicalPractice({ terms, pool, audioEnabled, size = PRACTICE_SIZE, level }: PracticeSessionInput): Exercise[] {
    const segmentPool = this.segmentPool(pool);
    const exercises: Exercise[] = [];
    const usage = new Map<string, number>();

    for (const term of this.pick(terms, size)) {
      const options: Exercise[] = [
        this.multipleChoice(term, pool),
        this.reverseChoice(term, pool),
        this.canType(term) ? this.typeTerm(term) : null,
        this.fillBlank(term, pool),
        this.buildFromRoots(term, segmentPool),
        this.registerChoice(term, pool),
        this.orderSentence(term, level),
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

    const extras = [terms.length >= 4 ? this.matchPairs(terms) : null, this.fillBlanks(terms)].filter(present);
    return extras.length > 0 ? this.shuffle([...exercises, ...extras]) : exercises;
  }

  private basicReveal(entry: BasicWord, example: string | null): Reveal {
    return {
      text: entry.word,
      definition: '',
      ipa: null,
      romanization: null,
      translation: entry.pt,
      informalForms: [],
      usageNote: entry.note,
      collocations: [],
      example,
      translations: [],
    };
  }

  /** Frase curta (3 ou 4 palavras) com o termo técnico: o aluno completa com a palavra básica. */
  basicSentence(entry: BasicWord, term: TermView): FillBlankExercise | null {
    if (entry.templates.length === 0) return null;
    const wordPattern = new RegExp(`\\b${entry.word}\\b`, 'i');
    if (wordPattern.test(term.target.text)) return null;

    const distractors = this.pick(sentenceDistractors(entry), 3);
    if (distractors.length < 3) return null;

    const sentence = this.pick(entry.templates, 1)[0].replace('{T}', term.target.text);
    return {
      id: randomUUID(),
      type: 'FILL_BLANK',
      termIds: [],
      basic: true,
      highlight: term.target.text,
      sentence: sentence.replace(wordPattern, BLANK),
      options: this.shuffle([entry.word, ...distractors].map((word) => ({ id: word, text: word }))),
      correctOptionId: entry.word,
      reveal: this.basicReveal(entry, sentence),
    };
  }

  /** Palavra isolada em inglês e três significados em português para escolher. */
  basicMeaning(entry: BasicWord, term?: TermView, bank: BasicWord[] = BASIC_WORDS): MultipleChoiceExercise | null {
    const distractors = this.pick(
      bank.filter((w) => w.word !== entry.word && !meaningsClash(entry, w)),
      3,
    );
    if (distractors.length < 3) return null;

    const wordPattern = new RegExp(`\\b${entry.word}\\b`, 'i');
    const usable = term && !wordPattern.test(term.target.text) && entry.templates.length > 0;
    const example = usable ? this.pick(entry.templates, 1)[0].replace('{T}', term.target.text) : null;

    return {
      id: randomUUID(),
      type: 'MULTIPLE_CHOICE',
      termIds: [],
      basic: true,
      prompt: entry.word,
      options: this.shuffle([entry, ...distractors].map((w) => ({ id: w.word, text: w.pt }))),
      correctOptionId: entry.word,
      direction: 'REVERSE',
      alphabet: false,
      reveal: this.basicReveal(entry, example),
    };
  }

  /**
   * Um exercício de inglês básico. Palavras com frase curta alternam entre completar a frase
   * (com o termo técnico no centro) e escolher o significado da palavra isolada; as demais
   * aparecem só no significado. Nenhum deles conta para o progresso do termo técnico.
   */
  basicExercise(entry: BasicWord, term: TermView): Exercise | null {
    const sentence = entry.templates.length > 0 && this.rng() < 0.5 ? this.basicSentence(entry, term) : null;
    return sentence ?? this.basicMeaning(entry, term);
  }

  /**
   * Mistura inglês básico nos exercícios técnicos, espalhado ao longo da sessão. `share` é a
   * parte técnica (0,7 = 70% técnico). O total respeita `cap`; o que sobra do técnico é cortado
   * do fim da lista, onde ficam os exercícios de produção.
   */
  withBasicEnglish(technical: Exercise[], terms: TermView[], share: number, cap: number): Exercise[] {
    if (share >= 1 || share <= 0 || technical.length === 0 || terms.length === 0) return technical;

    let keep = technical.length;
    let wanted = Math.round((keep * (1 - share)) / share);
    if (keep + wanted > cap) {
      keep = Math.floor(cap * share);
      wanted = cap - keep;
    }

    const kept = technical.slice(0, keep);
    const basics: Exercise[] = [];
    const words = this.shuffle(BASIC_WORDS);
    const queue = this.shuffle(terms);
    for (let i = 0; basics.length < wanted && i < words.length * 2; i++) {
      const exercise = this.basicExercise(words[i % words.length], queue[i % queue.length]);
      if (exercise) basics.push(exercise);
    }
    if (basics.length === 0) return kept;

    const mixed: Exercise[] = [];
    let next = 0;
    kept.forEach((exercise, index) => {
      mixed.push(exercise);
      while (next < basics.length && (index + 1) / kept.length >= (next + 1) / (basics.length + 1)) {
        mixed.push(basics[next++]);
      }
    });
    return mixed;
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
