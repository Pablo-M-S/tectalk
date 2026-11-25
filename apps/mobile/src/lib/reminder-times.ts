/** Horários oferecidos para o lembrete diário e mensagens que se alternam durante a semana. */
export interface ReminderTime {
  hour: number;
  minute: number;
}

export const REMINDER_TIMES: ReminderTime[] = [
  { hour: 7, minute: 0 },
  { hour: 8, minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 18, minute: 0 },
  { hour: 19, minute: 0 },
  { hour: 20, minute: 0 },
  { hour: 21, minute: 0 },
  { hour: 22, minute: 0 },
];

export const DEFAULT_REMINDER: ReminderTime = { hour: 19, minute: 0 };

const pad = (value: number) => String(value).padStart(2, '0');

export const formatTime = ({ hour, minute }: ReminderTime): string => `${pad(hour)}:${pad(minute)}`;

/** Interpreta "HH:MM"; devolve o horário padrão se o valor salvo for inválido. */
export function parseTime(value: string | null | undefined): ReminderTime {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value ?? '');
  if (!match) return DEFAULT_REMINDER;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour <= 23 && minute <= 59 ? { hour, minute } : DEFAULT_REMINDER;
}

/** Uma mensagem por dia da semana (0 = domingo), para o aviso não ficar repetitivo. */
export const REMINDER_MESSAGES: { title: string; body: string }[] = [
  { title: 'Domingo de estudo', body: 'Cinco minutos hoje deixam a semana mais leve.' },
  { title: 'Hora de estudar', body: 'Seus termos técnicos estão esperando. Vamos praticar?' },
  { title: 'Mantenha a sequência', body: 'Uma lição curta já conta para o seu dia.' },
  { title: 'Vocabulário em dia', body: 'Revise os termos de hoje antes que eles escapem.' },
  { title: 'Fale como um profissional', body: 'Pratique o termo certo para o documento certo.' },
  { title: 'Quase no fim de semana', body: 'Feche a semana com uma sessão rápida de prática.' },
  { title: 'Sábado produtivo', body: 'Que tal revisar o que você aprendeu nesta semana?' },
];

export const messageForWeekday = (weekday: number) =>
  REMINDER_MESSAGES[((weekday % 7) + 7) % 7];
