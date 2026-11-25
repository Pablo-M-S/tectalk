import { localDate, shiftDate } from './dates';

describe('localDate', () => {
  it('respeita o fuso horário informado', () => {
    // 02:30 UTC ainda é o dia anterior em São Paulo (UTC-3)
    const instant = new Date('2026-11-25T02:30:00Z');
    expect(localDate(instant, 'UTC')).toBe('2026-11-25');
    expect(localDate(instant, 'America/Sao_Paulo')).toBe('2026-11-24');
  });
});

describe('shiftDate', () => {
  it('soma e subtrai dias', () => {
    expect(shiftDate('2026-11-24', 1)).toBe('2026-11-25');
    expect(shiftDate('2026-11-24', -1)).toBe('2026-11-23');
  });

  it('atravessa meses e anos', () => {
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01');
    expect(shiftDate('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('considera anos bissextos', () => {
    expect(shiftDate('2028-02-28', 1)).toBe('2028-02-29');
  });
});
