import { splitIntoLevels } from '../prisma/content-schema';
import { LEGACY_LEVELS, REQUIRED_LEVELS, lessonGate } from '../src/content/level-gate';

describe('divisão em níveis', () => {
  const sizes = (n: number) => splitIntoLevels(Array.from({ length: n }, (_, i) => i)).map((g) => g.length);

  it('divide 6 termos em dois níveis de 3', () => {
    expect(sizes(6)).toEqual([3, 3]);
  });

  it('nunca passa de 4 termos por nível e mantém a ordem', () => {
    for (let n = 1; n <= 120; n++) {
      const groups = splitIntoLevels(Array.from({ length: n }, (_, i) => i));
      expect(groups.every((g) => g.length <= 4)).toBe(true);
      expect(groups.flat()).toEqual(Array.from({ length: n }, (_, i) => i));
    }
  });

  it('de 6 termos em diante todo nível fica com 3 ou 4', () => {
    for (let n = 6; n <= 120; n++) {
      expect(sizes(n).every((size) => size >= 3 && size <= 4)).toBe(true);
    }
  });

  it('lista vazia não gera nível', () => {
    expect(splitIntoLevels([])).toEqual([]);
  });
});

describe('desbloqueio da lição seguinte', () => {
  it('exige o nível 3 concluído', () => {
    expect(REQUIRED_LEVELS).toBe(3);
    expect(lessonGate({ levelCount: 12, completedLevels: 2, legacyCompleted: false }).passed).toBe(false);
    expect(lessonGate({ levelCount: 12, completedLevels: 3, legacyCompleted: false }).passed).toBe(true);
  });

  it('lição com menos de 3 níveis libera ao concluir todos', () => {
    expect(lessonGate({ levelCount: 2, completedLevels: 1, legacyCompleted: false }).passed).toBe(false);
    expect(lessonGate({ levelCount: 2, completedLevels: 2, legacyCompleted: false })).toEqual({ passed: true, required: 2 });
  });

  it('conclusão antiga, de antes dos níveis, mantém a lição aprovada', () => {
    expect(lessonGate({ levelCount: 12, completedLevels: 0, legacyCompleted: true }).passed).toBe(true);
    expect(LEGACY_LEVELS).toBe(2);
  });

  it('sem níveis no banco, só a conclusão antiga vale', () => {
    expect(lessonGate({ levelCount: 0, completedLevels: 0, legacyCompleted: false }).passed).toBe(false);
    expect(lessonGate({ levelCount: 0, completedLevels: 0, legacyCompleted: true }).passed).toBe(true);
  });
});
