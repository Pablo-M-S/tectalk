import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Language, Prisma, TermLocale } from '@prisma/client';
import { AUDIO_PROVIDER, type AudioProvider } from '../audio/audio.provider';
import { env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
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

  async buildLessonSession(lessonId: string) {
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

    return {
      lesson: { id: lesson.id, title: lesson.title },
      exercises: this.factory.buildLessonSession({
        terms,
        pool,
        audioEnabled: this.audioEnabled,
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
    const example = row.examples[0];

    return {
      id: row.id,
      source: this.localeView(source),
      target: this.localeView(target),
      example: example ? { sentence: example.sentence, answer: example.answer } : null,
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
      audioUrl: locale.audioUrl,
      audioReady: locale.audioStatus === 'READY' && locale.audioUrl !== null,
    };
  }
}
