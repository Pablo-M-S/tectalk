import { Rating } from 'ts-fsrs';
import { FsrsService, type ReviewCardState } from './fsrs.service';

describe('FsrsService', () => {
  const service = new FsrsService();
  const now = new Date('2026-11-25T12:00:00Z');

  it('agenda um cartão novo para o futuro', () => {
    const card = service.schedule(null, Rating.Good, now);
    expect(card.reps).toBe(1);
    expect(card.due as Date).toBeInstanceOf(Date);
    expect((card.due as Date).getTime()).toBeGreaterThan(now.getTime());
    expect(card.lastReview).toEqual(now);
  });

  it('acertar adia mais a revisão do que errar', () => {
    const good = service.schedule(null, Rating.Good, now);
    const again = service.schedule(null, Rating.Again, now);
    expect((good.due as Date).getTime()).toBeGreaterThan((again.due as Date).getTime());
  });

  it('acumula repetições ao reaplicar o resultado', () => {
    const first = service.schedule(null, Rating.Good, now);
    const later = new Date((first.due as Date).getTime() + 60_000);
    const second = service.schedule(first as ReviewCardState, Rating.Good, later);
    expect(second.reps).toBe(2);
    expect((second.due as Date).getTime()).toBeGreaterThan(later.getTime());
  });
});
