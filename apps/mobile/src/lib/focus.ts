import type { ProficiencyLevel } from '@/api/types';

/** Parte de cada sessão dedicada aos termos técnicos, por nível. O resto é inglês básico. */
export const TECHNICAL_SHARE: Record<ProficiencyLevel, number> = {
  BEGINNER: 0.5,
  BASIC: 0.6,
  INTERMEDIATE: 0.7,
  ADVANCED: 1,
};

/** Quantas respostas recentes de inglês básico entram na medição. */
export const WINDOW = 40;
/** Respostas mínimas antes de a medição ajustar o foco. */
export const MIN_SAMPLE = 20;

/** Histórico em texto: '1' acerto, '0' erro, o mais recente por último. */
export const pushResult = (history: string, correct: boolean): string =>
  `${history}${correct ? '1' : '0'}`.slice(-WINDOW);

/** Precisão recente (0 a 1), ou undefined enquanto há poucas respostas para medir. */
export function accuracyOf(history: string): number | undefined {
  if (history.length < MIN_SAMPLE) return undefined;
  return [...history].filter((c) => c === '1').length / history.length;
}

/**
 * Foco técnico atual. Idêntico ao cálculo do servidor: quem acerta o inglês básico
 * recebe mais termos técnicos, até metade do que faltava para 100%.
 */
export function technicalShare(level: ProficiencyLevel | null | undefined, accuracy?: number): number {
  const base = level ? TECHNICAL_SHARE[level] : 1;
  if (base >= 1 || accuracy === undefined) return base;
  const gap = 1 - base;
  if (accuracy >= 0.9) return base + gap * 0.5;
  if (accuracy >= 0.8) return base + gap * 0.25;
  return base;
}

/** "70% termos técnicos · 30% inglês básico", ou null quando a sessão é só técnica. */
export function focusLabel(level: ProficiencyLevel | null | undefined, accuracy?: number): string | null {
  const technical = Math.round(technicalShare(level, accuracy) * 100);
  if (technical >= 100) return null;
  return `${technical}% termos técnicos · ${100 - technical}% inglês básico`;
}
