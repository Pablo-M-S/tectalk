import { DEFAULT_REMINDER, REMINDER_MESSAGES, formatTime, messageForWeekday, parseTime } from '@/lib/reminder-times';

describe('reminder-times', () => {
  it('formata horário com zero à esquerda', () => {
    expect(formatTime({ hour: 7, minute: 5 })).toBe('07:05');
  });

  it('interpreta horários válidos', () => {
    expect(parseTime('21:30')).toEqual({ hour: 21, minute: 30 });
  });

  it('volta ao padrão quando o valor salvo é inválido', () => {
    expect(parseTime(null)).toEqual(DEFAULT_REMINDER);
    expect(parseTime('25:00')).toEqual(DEFAULT_REMINDER);
    expect(parseTime('abc')).toEqual(DEFAULT_REMINDER);
  });

  it('tem uma mensagem para cada dia da semana', () => {
    expect(REMINDER_MESSAGES).toHaveLength(7);
    expect(messageForWeekday(0)).toBe(REMINDER_MESSAGES[0]);
    expect(messageForWeekday(7)).toBe(REMINDER_MESSAGES[0]);
  });
});
