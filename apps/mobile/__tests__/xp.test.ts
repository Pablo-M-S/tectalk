import { xpProgress, xpToNext } from '../src/lib/xp';

describe('xpProgress', () => {
  it('começa no nível 1 com a barra vazia', () => {
    expect(xpProgress(0)).toEqual({ level: 1, into: 0, needed: 100, ratio: 0 });
  });

  it('preenche a barra dentro do nível', () => {
    expect(xpProgress(40)).toEqual({ level: 1, into: 40, needed: 100, ratio: 0.4 });
  });

  it('sobe de nível ao completar a barra e recomeça', () => {
    expect(xpProgress(100)).toEqual({ level: 2, into: 0, needed: 150, ratio: 0 });
    expect(xpProgress(175)).toEqual({ level: 2, into: 75, needed: 150, ratio: 0.5 });
  });

  it('cada nível exige mais XP que o anterior', () => {
    expect(xpToNext(1)).toBe(100);
    expect(xpToNext(2)).toBe(150);
    expect(xpToNext(5)).toBe(300);
    expect(xpProgress(250).level).toBe(3);
  });

  it('ignora valores negativos e frações', () => {
    expect(xpProgress(-20).level).toBe(1);
    expect(xpProgress(99.9).level).toBe(1);
  });
});
