import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LEGACY_LEVELS, lessonGate } from './level-gate';

export type LessonStatus = 'LOCKED' | 'AVAILABLE' | 'COMPLETED';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  /** Catálogo de áreas, com o progresso do usuário em cada uma. */
  async listTracks(userId: string) {
    const tracks = await this.prisma.track.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        profession: true,
        sourceLanguage: true,
        targetLanguage: true,
        units: {
          select: {
            lessons: {
              where: { status: 'PUBLISHED' },
              select: {
                id: true,
                _count: { select: { terms: true, levels: true } },
                completions: { where: { userId }, select: { levelId: true } },
              },
            },
          },
        },
      },
    });

    return tracks.map(({ units, ...track }) => {
      const lessons = units.flatMap((unit) => unit.lessons);
      return {
        ...track,
        lessonCount: lessons.length,
        completedCount: lessons.filter((lesson) =>
          lessonGate({
            levelCount: lesson._count.levels,
            completedLevels: new Set(lesson.completions.flatMap((c) => (c.levelId ? [c.levelId] : []))).size,
            legacyCompleted: lesson.completions.some((c) => c.levelId === null),
          }).passed,
        ).length,
        termCount: lessons.reduce((sum, lesson) => sum + lesson._count.terms, 0),
      };
    });
  }

  /** Trilha com unidades, lições e o estado de progresso do usuário (caminho linear). */
  async getTrack(slug: string, userId: string) {
    const track = await this.prisma.track.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: {
        units: {
          orderBy: { position: 'asc' },
          include: {
            lessons: {
              where: { status: 'PUBLISHED' },
              orderBy: { position: 'asc' },
              include: {
                _count: { select: { terms: true } },
                levels: {
                  orderBy: { position: 'asc' },
                  include: { _count: { select: { terms: true } } },
                },
              },
            },
          },
        },
      },
    });
    if (!track) throw new NotFoundException('Trilha não encontrada');

    const lessonIds = track.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id));
    const completions = await this.prisma.lessonCompletion.findMany({
      where: { userId, lessonId: { in: lessonIds } },
      select: { lessonId: true, levelId: true, score: true },
    });
    const byLesson = new Map<string, { levelId: string | null; score: number }[]>();
    for (const row of completions) {
      byLesson.set(row.lessonId, [...(byLesson.get(row.lessonId) ?? []), row]);
    }

    let previousPassed = true;
    return {
      id: track.id,
      slug: track.slug,
      title: track.title,
      description: track.description,
      sourceLanguage: track.sourceLanguage,
      targetLanguage: track.targetLanguage,
      units: track.units.map((unit) => ({
        id: unit.id,
        slug: unit.slug,
        title: unit.title,
        lessons: unit.lessons.map((lesson) => {
          const rows = byLesson.get(lesson.id) ?? [];
          const legacy = rows.some((r) => r.levelId === null);
          const bestByLevel = new Map<string, number>();
          for (const row of rows) {
            if (row.levelId) bestByLevel.set(row.levelId, Math.max(bestByLevel.get(row.levelId) ?? 0, row.score));
          }
          const gate = lessonGate({
            levelCount: lesson.levels.length,
            completedLevels: bestByLevel.size,
            legacyCompleted: legacy,
          });
          const status: LessonStatus = gate.passed ? 'COMPLETED' : previousPassed ? 'AVAILABLE' : 'LOCKED';
          previousPassed = gate.passed;
          const levels = lesson.levels.map((level) => ({
            id: level.id,
            position: level.position,
            title: level.title,
            termCount: level._count.terms,
            completed: (legacy && level.position <= LEGACY_LEVELS) || bestByLevel.has(level.id),
            bestScore: bestByLevel.get(level.id) ?? null,
          }));
          const scores = rows.map((r) => r.score);
          return {
            id: lesson.id,
            slug: lesson.slug,
            title: lesson.title,
            termCount: lesson._count.terms,
            status,
            bestScore: scores.length > 0 ? Math.max(...scores) : null,
            levelCount: levels.length,
            levelsCompleted: levels.filter((l) => l.completed).length,
            requiredLevels: gate.required,
            levels,
          };
        }),
      })),
    };
  }
}
