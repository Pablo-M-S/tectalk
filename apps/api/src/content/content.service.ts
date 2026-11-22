import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type LessonStatus = 'LOCKED' | 'AVAILABLE' | 'COMPLETED';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  listTracks() {
    return this.prisma.track.findMany({
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
        _count: { select: { units: true } },
      },
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
              include: { _count: { select: { terms: true } } },
            },
          },
        },
      },
    });
    if (!track) throw new NotFoundException('Trilha não encontrada');

    const lessonIds = track.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id));
    const best = await this.prisma.lessonCompletion.groupBy({
      by: ['lessonId'],
      where: { userId, lessonId: { in: lessonIds } },
      _max: { score: true },
    });
    const bestScore = new Map(best.map((row) => [row.lessonId, row._max.score ?? 0]));

    let previousCompleted = true;
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
          const completed = bestScore.has(lesson.id);
          const status: LessonStatus = completed
            ? 'COMPLETED'
            : previousCompleted
              ? 'AVAILABLE'
              : 'LOCKED';
          previousCompleted = completed;
          return {
            id: lesson.id,
            slug: lesson.slug,
            title: lesson.title,
            termCount: lesson._count.terms,
            status,
            bestScore: bestScore.get(lesson.id) ?? null,
          };
        }),
      })),
    };
  }
}
