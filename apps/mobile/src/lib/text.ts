/** Normaliza respostas digitadas: sem acentos, pontuação comum ou diferença de caixa. */
export function normalizeAnswer(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.,;:!?'"“”‘’()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatPercent(score: number | null): string {
  return score === null ? '' : `${Math.round(score * 100)}%`;
}
