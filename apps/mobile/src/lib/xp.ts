/**
 * Níveis por XP acumulado. Subir de nível exige um pouco mais a cada vez:
 * nível 1 → 2 pede 100 XP, depois 150, 200, 250...
 */
const BASE = 100;
const STEP = 50;

export interface XpProgress {
  level: number;
  /** XP já acumulado dentro do nível atual. */
  into: number;
  /** XP total que o nível atual exige para completar. */
  needed: number;
  /** 0 a 1, preenchimento da barra. */
  ratio: number;
}

/** XP necessário para sair do nível `level` para o seguinte. */
export const xpToNext = (level: number): number => BASE + STEP * (level - 1);

export function xpProgress(totalXp: number): XpProgress {
  let remaining = Math.max(0, Math.floor(totalXp));
  let level = 1;
  while (remaining >= xpToNext(level)) {
    remaining -= xpToNext(level);
    level += 1;
  }
  const needed = xpToNext(level);
  return { level, into: remaining, needed, ratio: remaining / needed };
}
