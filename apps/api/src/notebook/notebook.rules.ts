/** Quantos termos ficam no lote ativo. */
export const BATCH_SIZE = 4;
/** Quantas vezes por dia cada termo é escrito: 1 olhando e o resto de memória. */
export const TOUCHES_PER_DAY = 3;
/** Erros seguidos de memória que mandam o termo de volta para "olhar e copiar". */
export const MAX_MISSES = 2;

export type TouchMode = 'copy' | 'recall';

export interface EntryCounters {
  touches: number;
  touchDay: string;
  misses: number;
}

/** Um novo dia zera a contagem de escritas, mas não o que já foi dominado. */
export function countersFor(entry: EntryCounters, today: string): EntryCounters {
  return entry.touchDay === today ? entry : { touches: 0, touchDay: today, misses: 0 };
}

export const modeFor = (counters: EntryCounters): TouchMode => (counters.touches === 0 ? 'copy' : 'recall');

const clean = (text: string): string =>
  text
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?。、！？]+$/u, '')
    .replace(/\s+/g, ' ');

const stripMarks = (text: string): string => text.normalize('NFD').replace(/\p{M}/gu, '');

export interface Judged {
  correct: boolean;
  /** Acertou só sem os acentos. */
  accentsOff: boolean;
}

/** Compara o que foi escrito com as formas aceitas (palavra, leitura, romanização). */
export function judge(answer: string, accepted: (string | null | undefined)[]): Judged {
  const given = clean(answer);
  if (!given) return { correct: false, accentsOff: false };
  const options = accepted.filter((a): a is string => Boolean(a)).map(clean);
  if (options.includes(given)) return { correct: true, accentsOff: false };
  const bare = stripMarks(given);
  if (options.some((o) => stripMarks(o) === bare)) return { correct: true, accentsOff: true };
  return { correct: false, accentsOff: false };
}

export interface TouchOutcome extends EntryCounters {
  /** O termo voltou para "olhar e copiar" depois de errar de memória. */
  relearn: boolean;
  /** As escritas do dia deste termo foram concluídas agora. */
  dayDone: boolean;
}

/** Aplica o resultado de uma escrita. Errar ao copiar não conta como falha. */
export function applyTouch(counters: EntryCounters, correct: boolean): TouchOutcome {
  const mode = modeFor(counters);
  if (correct) {
    const touches = counters.touches + 1;
    return { touches, touchDay: counters.touchDay, misses: 0, relearn: false, dayDone: touches === TOUCHES_PER_DAY };
  }
  if (mode === 'copy') return { ...counters, relearn: false, dayDone: false };
  const misses = counters.misses + 1;
  if (misses >= MAX_MISSES) {
    return { touches: 0, touchDay: counters.touchDay, misses: 0, relearn: true, dayDone: false };
  }
  return { ...counters, misses, relearn: false, dayDone: false };
}
