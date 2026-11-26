import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { localDate } from '../common/dates';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewService } from '../review/review.service';
import { applyTouch, BATCH_SIZE, countersFor, judge, modeFor, TOUCHES_PER_DAY } from './notebook.rules';

interface NotebookTerm {
  termId: string;
  prompt: string;
  hint: string;
  text: string;
  reading: string | null;
  romanization: string | null;
}

@Injectable()
export class NotebookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviews: ReviewService,
  ) {}

  /** Lote ativo do usuário nesta trilha; abre um novo quando todos os termos foram dominados. */
  async state(userId: string, trackSlug: string) {
    const track = await this.requireTrack(trackSlug);
    const today = await this.today(userId);
    const terms = await this.termsOf(track);
    const byId = new Map(terms.map((t) => [t.termId, t]));

    let entries = await this.prisma.notebookEntry.findMany({
      where: { userId, trackId: track.id },
      orderBy: { createdAt: 'asc' },
    });

    if (!entries.some((e) => e.status === 'LEARNING')) {
      const used = new Set(entries.map((e) => e.termId));
      const next = terms.filter((t) => !used.has(t.termId)).slice(0, BATCH_SIZE);
      if (next.length > 0) {
        await this.prisma.notebookEntry.createMany({
          data: next.map((t) => ({ userId, termId: t.termId, trackId: track.id, touchDay: today })),
          skipDuplicates: true,
        });
        entries = await this.prisma.notebookEntry.findMany({
          where: { userId, trackId: track.id },
          orderBy: { createdAt: 'asc' },
        });
      }
    }

    const batch = entries
      .filter((e) => e.status === 'LEARNING' && byId.has(e.termId))
      .map((entry) => {
        const term = byId.get(entry.termId)!;
        const counters = countersFor(entry, today);
        const mode = modeFor(counters);
        return {
          termId: entry.termId,
          prompt: term.prompt,
          hint: term.hint,
          touches: counters.touches,
          mode,
          // A resposta só aparece na hora de olhar e copiar.
          show: mode === 'copy' ? { text: term.text, reading: term.reading, romanization: term.romanization } : null,
        };
      });

    return {
      trackSlug: track.slug,
      targetLanguage: track.targetLanguage,
      touchesPerDay: TOUCHES_PER_DAY,
      batch,
      masteredCount: entries.filter((e) => e.status === 'MASTERED').length,
      totalTerms: terms.length,
      finished: batch.length === 0,
    };
  }

  async touch(userId: string, trackSlug: string, input: { termId: string; answer: string }) {
    const track = await this.requireTrack(trackSlug);
    const today = await this.today(userId);
    const entry = await this.requireEntry(userId, track.id, input.termId);
    const term = (await this.termsOf(track)).find((t) => t.termId === input.termId);
    if (!term) throw new NotFoundException('Termo não encontrado');

    const counters = countersFor(entry, today);
    const judged = judge(input.answer, [term.text, term.reading, term.romanization]);
    const outcome = applyTouch(counters, judged.correct);

    await this.prisma.notebookEntry.update({
      where: { id: entry.id },
      data: { touches: outcome.touches, touchDay: today, misses: outcome.misses },
    });

    return {
      correct: judged.correct,
      accentsOff: judged.accentsOff,
      expected: term.text,
      reading: term.reading,
      touches: outcome.touches,
      relearn: outcome.relearn,
      dayDone: outcome.dayDone,
    };
  }

  /** O usuário garante que memorizou: o termo sai do lote e entra na revisão espaçada. */
  async master(userId: string, trackSlug: string, termId: string) {
    const track = await this.requireTrack(trackSlug);
    const entry = await this.requireEntry(userId, track.id, termId);
    if (entry.status === 'MASTERED') return this.state(userId, trackSlug);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.notebookEntry.update({
        where: { id: entry.id },
        data: { status: 'MASTERED', masteredAt: new Date() },
      });
      await this.reviews.applyResults(tx, {
        userId,
        trackId: track.id,
        results: [{ termId, correct: true }],
        now: new Date(),
      });
    });
    return this.state(userId, trackSlug);
  }

  private async requireEntry(userId: string, trackId: string, termId: string) {
    const entry = await this.prisma.notebookEntry.findUnique({
      where: { userId_termId_trackId: { userId, termId, trackId } },
    });
    if (!entry) throw new BadRequestException('Este termo não está no seu caderno');
    return entry;
  }

  private async requireTrack(slug: string) {
    const track = await this.prisma.track.findFirst({ where: { slug, status: 'PUBLISHED' } });
    if (!track) throw new NotFoundException('Trilha não encontrada');
    return track;
  }

  private async today(userId: string): Promise<string> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { timezone: true } });
    return localDate(new Date(), user.timezone);
  }

  /** Termos da trilha na ordem das lições. */
  private async termsOf(track: { id: string; sourceLanguage: string; targetLanguage: string }): Promise<NotebookTerm[]> {
    const rows = await this.prisma.lessonTerm.findMany({
      where: { lesson: { status: 'PUBLISHED', unit: { trackId: track.id } } },
      orderBy: [{ lesson: { unit: { position: 'asc' } } }, { lesson: { position: 'asc' } }, { position: 'asc' }],
      include: { term: { include: { locales: true } } },
    });
    const seen = new Set<string>();
    const result: NotebookTerm[] = [];
    for (const row of rows) {
      if (seen.has(row.termId) || row.term.status !== 'PUBLISHED') continue;
      const source = row.term.locales.find((l) => l.language === track.sourceLanguage);
      const target = row.term.locales.find((l) => l.language === track.targetLanguage);
      if (!source || !target) continue;
      seen.add(row.termId);
      result.push({
        termId: row.termId,
        prompt: source.text,
        hint: source.definition,
        text: target.text,
        reading: target.ipa,
        romanization: target.romanization,
      });
    }
    return result;
  }
}
