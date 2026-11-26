import { lessonXp, uniqueResults } from './xp.rules';

const id = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;

describe('regras de XP', () => {
  it('repetir o mesmo termo não multiplica os acertos', () => {
    const results = Array.from({ length: 50 }, () => ({ termId: id(1), correct: true }));
    expect(uniqueResults(results)).toEqual([{ termId: id(1), correct: true }]);
  });

  it('um erro em qualquer tentativa torna o termo errado', () => {
    const results = [
      { termId: id(1), correct: true },
      { termId: id(1), correct: false },
      { termId: id(2), correct: true },
    ];
    expect(uniqueResults(results)).toEqual([
      { termId: id(1), correct: false },
      { termId: id(2), correct: true },
    ]);
  });

  it('a primeira conclusão paga o XP inteiro, com bônus de lição perfeita', () => {
    expect(lessonXp(6, 1, 0)).toBe(21);
    expect(lessonXp(4, 0.5, 0)).toBe(14);
  });

  it('refazer a lição rende só uma parte, nunca zero', () => {
    expect(lessonXp(6, 1, 1)).toBe(6);
    expect(lessonXp(0, 0, 3)).toBe(3);
  });
});
