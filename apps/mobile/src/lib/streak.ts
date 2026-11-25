/** A cada quantos acertos seguidos a tela de comemoração aparece. */
export const STREAK_STEP = 4;

const MESSAGES = [
  { title: 'Maravilha!', subtitle: 'Você está fazendo um grande progresso' },
  { title: 'Mandou bem!', subtitle: 'Continue nesse ritmo' },
  { title: 'Isso aí!', subtitle: 'Você está dominando esses termos' },
  { title: 'Que sequência!', subtitle: 'Sua dedicação está aparecendo' },
  { title: 'Excelente!', subtitle: 'Não pare agora, você está voando' },
];

/** Marco de comemoração ao qual uma sequência de acertos chegou, ou `null` se não há. */
export function milestoneFor(streak: number): number | null {
  return streak > 0 && streak % STREAK_STEP === 0 ? streak / STREAK_STEP : null;
}

/** Mensagens se revezam a cada marco, voltando ao início depois da última. */
export const celebrationMessage = (milestone: number) => MESSAGES[(milestone - 1) % MESSAGES.length];

export const MESSAGE_COUNT = MESSAGES.length;
