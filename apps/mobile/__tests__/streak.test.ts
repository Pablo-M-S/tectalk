import { celebrationMessage, MESSAGE_COUNT, milestoneFor, STREAK_STEP } from '../src/lib/streak';

describe('milestoneFor', () => {
  it('só comemora em múltiplos da sequência', () => {
    expect(milestoneFor(0)).toBeNull();
    expect(milestoneFor(STREAK_STEP - 1)).toBeNull();
    expect(milestoneFor(STREAK_STEP)).toBe(1);
    expect(milestoneFor(STREAK_STEP + 1)).toBeNull();
    expect(milestoneFor(STREAK_STEP * 2)).toBe(2);
  });
});

describe('celebrationMessage', () => {
  it('começa pela mensagem principal', () => {
    expect(celebrationMessage(1).title).toBe('Maravilha!');
    expect(celebrationMessage(1).subtitle).toBe('Você está fazendo um grande progresso');
  });

  it('se reveza e volta ao início', () => {
    expect(celebrationMessage(MESSAGE_COUNT + 1)).toEqual(celebrationMessage(1));
    expect(celebrationMessage(2)).not.toEqual(celebrationMessage(1));
  });
});
