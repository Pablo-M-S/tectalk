import { WINDOW, accuracyOf, focusLabel, pushResult, technicalShare } from '../src/lib/focus';

describe('foco entre termos técnicos e inglês básico', () => {
  it('define a parte técnica por nível', () => {
    expect(technicalShare('BEGINNER')).toBe(0.5);
    expect(technicalShare('BASIC')).toBe(0.6);
    expect(technicalShare('INTERMEDIATE')).toBe(0.7);
    expect(technicalShare('ADVANCED')).toBe(1);
    expect(technicalShare(null)).toBe(1);
  });

  it('acertar o inglês básico aumenta o foco técnico', () => {
    expect(technicalShare('BEGINNER', 0.95)).toBe(0.75);
    expect(technicalShare('BASIC', 0.85)).toBeCloseTo(0.7);
    expect(technicalShare('BASIC', 0.5)).toBe(0.6);
    expect(technicalShare('ADVANCED', 0.1)).toBe(1);
  });

  it('só mede depois de respostas suficientes e guarda apenas as mais recentes', () => {
    expect(accuracyOf('1111')).toBeUndefined();
    expect(accuracyOf('1'.repeat(20))).toBe(1);
    let history = '';
    for (let i = 0; i < WINDOW + 10; i++) history = pushResult(history, i % 2 === 0);
    expect(history).toHaveLength(WINDOW);
    expect(accuracyOf(history)).toBe(0.5);
  });

  it('descreve o foco em texto, ou nada quando é só técnico', () => {
    expect(focusLabel('INTERMEDIATE')).toBe('70% termos técnicos · 30% inglês básico');
    expect(focusLabel('BEGINNER')).toBe('50% termos técnicos · 50% inglês básico');
    expect(focusLabel('ADVANCED')).toBeNull();
    expect(focusLabel(null)).toBeNull();
  });
});
