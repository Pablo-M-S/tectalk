import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Language, Prisma, TermLocale } from '@prisma/client';
import { AUDIO_PROVIDER, type AudioProvider } from '../audio/audio.provider';
import { env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { technicalShare, type Level } from './basic-english';
import { ExerciseFactory, LocaleView, TermView } from './exercise.factory';
import { Exercise } from './exercise.types';

export interface LanguagePair {
  profession: string;
  sourceLanguage: Language;
  targetLanguage: Language;
}

const termArgs = (pair: LanguagePair) =>
  ({
    include: {
      locales: { where: { language: { in: [pair.sourceLanguage, pair.targetLanguage] } } },
      examples: { where: { language: pair.targetLanguage } },
      morphemes: {
        where: { language: pair.targetLanguage },
        orderBy: { position: 'asc' },
        include: { morpheme: true },
      },
    },
  }) satisfies Prisma.TermDefaultArgs;

type TermRow = Prisma.TermGetPayload<ReturnType<typeof termArgs>>;

@Injectable()
export class ExerciseService {
  private readonly factory = new ExerciseFactory();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUDIO_PROVIDER) private readonly audio: AudioProvider,
  ) {}

  private get audioEnabled(): boolean {
    return env.AUDIO_ENABLED && this.audio.enabled;
  }

  /**
   * Parte técnica da sessão. Só o inglês leva inglês básico junto: nos outros idiomas
   * (e para quem ainda não informou o nível) a sessão continua só com termos técnicos.
   */
  private async sessionShare(level: Level | null, target: Language, basicAccuracy?: number): Promise<number> {
    if (target !== 'EN') return 1;
    return technicalShare(level, basicAccuracy);
  }

  private async userLevel(userId: string): Promise<Level | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { level: true } });
    return (user?.level as Level | null | undefined) ?? null;
  }

  async buildLessonSession(lessonId: string, userId: string, basicAccuracy?: number) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, status: 'PUBLISHED', unit: { track: { status: 'PUBLISHED' } } },
      include: {
        unit: { include: { track: true } },
        terms: { orderBy: { position: 'asc' }, select: { termId: true } },
      },
    });
    if (!lesson) throw new NotFoundException('Lição não encontrada');

    const pool = await this.loadViews(lesson.unit.track);
    const lessonTermIds = new Set(lesson.terms.map((t) => t.termId));
    const terms = pool.filter((view) => lessonTermIds.has(view.id));
    const level = await this.userLevel(userId);

    return {
      lesson: { id: lesson.id, title: lesson.title },
      exercises: this.factory.buildLessonSession({
        terms,
        pool,
        audioEnabled: this.audioEnabled,
        technicalShare: await this.sessionShare(level, lesson.unit.track.targetLanguage, basicAccuracy),
        level,
      }),
    };
  }

  /**
   * Prática livre: sessão nova a cada chamada, só com termos de lições que o
   * usuário já concluiu, misturando todos os tipos de exercício.
   */
  async buildPracticeSession(userId: string, trackSlug: string, basicAccuracy?: number) {
    const track = await this.prisma.track.findFirst({
      where: { slug: trackSlug, status: 'PUBLISHED' },
    });
    if (!track) throw new NotFoundException('Trilha não encontrada');

    const studied = await this.prisma.lessonTerm.findMany({
      where: {
        lesson: {
          status: 'PUBLISHED',
          unit: { trackId: track.id },
          completions: { some: { userId } },
        },
      },
      select: { termId: true },
      distinct: ['termId'],
    });
    const studiedIds = new Set(studied.map((row) => row.termId));
    if (studiedIds.size === 0) return { studiedCount: 0, exercises: [] as Exercise[] };

    const pool = await this.loadViews(track);
    const terms = pool.filter((view) => studiedIds.has(view.id));
    const level = await this.userLevel(userId);

    return {
      studiedCount: terms.length,
      exercises: this.factory.buildPracticeSession({
        terms,
        pool,
        audioEnabled: this.audioEnabled,
        technicalShare: await this.sessionShare(level, track.targetLanguage, basicAccuracy),
        level,
      }),
    };
  }

  /** Revisão: reconhecimento para cartões recentes, digitação para os consolidados. */
  async buildReviewSession(
    pair: LanguagePair,
    cards: { termId: string; reps: number }[],
  ): Promise<Exercise[]> {
    if (cards.length === 0) return [];

    const pool = await this.loadViews(pair);
    const byId = new Map(pool.map((view) => [view.id, view]));
    const exercises: Exercise[] = [];

    for (const card of cards) {
      const term = byId.get(card.termId);
      if (!term) continue;
      const exercise =
        card.reps >= 3
          ? this.factory.typeTerm(term)
          : (this.factory.multipleChoice(term, pool) ?? this.factory.typeTerm(term));
      exercises.push(exercise);
    }
    return exercises;
  }

  private async loadViews(pair: LanguagePair): Promise<TermView[]> {
    const rows = await this.prisma.term.findMany({
      where: { domain: pair.profession, status: 'PUBLISHED' },
      ...termArgs(pair),
    });
    return rows.flatMap((row) => {
      const view = this.toView(row, pair);
      return view ? [view] : [];
    });
  }

  private toView(row: TermRow, pair: LanguagePair): TermView | null {
    const source = row.locales.find((l) => l.language === pair.sourceLanguage);
    const target = row.locales.find((l) => l.language === pair.targetLanguage);
    if (!source || !target) return null;

    const meaningKey = pair.sourceLanguage.toLowerCase();

    return {
      id: row.id,
      source: this.localeView(source),
      target: this.localeView(target),
      examples: row.examples.map((e) => ({ sentence: e.sentence, answer: e.answer })),
      parts: row.morphemes.map((m) => ({
        segment: m.segment,
        meaning: (m.morpheme.meanings as Record<string, string>)[meaningKey] ?? '',
      })),
    };
  }

  private localeView(locale: TermLocale): LocaleView {
    return {
      text: locale.text,
      definition: locale.definition,
      informalForms: locale.informalForms,
      ipa: locale.ipa,
      romanization: locale.romanization,
      usageNote: locale.usageNote,
      collocations: locale.collocations,
      audioUrl: locale.audioUrl,
      audioReady: locale.audioStatus === 'READY' && locale.audioUrl !== null,
    };
  }
}
