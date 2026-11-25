import { formatPercent, normalizeAnswer } from '../src/lib/text';

describe('normalizeAnswer', () => {
  it('ignora caixa, acentos e pontuação comum', () => {
    expect(normalizeAnswer('  Arrítmia, ')).toBe('arritmia');
    expect(normalizeAnswer('“Heart  Valve.”')).toBe('heart valve');
  });

  it('colapsa espaços repetidos', () => {
    expect(normalizeAnswer('myocardial   infarction')).toBe('myocardial infarction');
  });

  it('mantém hífens, que fazem parte de termos', () => {
    expect(normalizeAnswer('Beta-blocker')).toBe('beta-blocker');
  });
});

describe('formatPercent', () => {
  it('arredonda e formata', () => {
    expect(formatPercent(0.856)).toBe('86%');
    expect(formatPercent(1)).toBe('100%');
  });

  it('devolve vazio sem nota', () => {
    expect(formatPercent(null)).toBe('');
  });
});
