/** Níveis que a pessoa precisa concluir para liberar a lição seguinte. */
export const REQUIRED_LEVELS = 3;

/** Lições concluídas antes dos níveis (6 termos) equivalem aos dois primeiros níveis. */
export const LEGACY_LEVELS = 2;

export interface GateInput {
  levelCount: number;
  completedLevels: number;
  /** Conclusão registrada antes dos níveis existirem: vale como lição aprovada. */
  legacyCompleted: boolean;
}

export interface Gate {
  passed: boolean;
  required: number;
}

export function lessonGate({ levelCount, completedLevels, legacyCompleted }: GateInput): Gate {
  const required = Math.min(REQUIRED_LEVELS, levelCount);
  if (legacyCompleted) return { passed: true, required };
  if (levelCount === 0) return { passed: false, required: 0 };
  return { passed: completedLevels >= required, required };
}
