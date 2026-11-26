import { applyTouch, countersFor, judge, modeFor, TOUCHES_PER_DAY } from './notebook.rules';

const fresh = { touches: 0, touchDay: '2026-11-26', misses: 0 };

describe('caderno de memorização', () => {
  it('um novo dia zera as escritas', () => {
    expect(countersFor({ touches: 3, touchDay: '2026-11-25', misses: 1 }, '2026-11-26')).toEqual(fresh);
    const same = { touches: 2, touchDay: '2026-11-26', misses: 0 };
    expect(countersFor(same, '2026-11-26')).toBe(same);
  });

  it('a primeira escrita do dia é olhando; as seguintes, de memória', () => {
    expect(modeFor(fresh)).toBe('copy');
    expect(modeFor({ ...fresh, touches: 1 })).toBe('recall');
  });

  it('aceita a palavra, a leitura e ignora caixa e pontuação final', () => {
    expect(judge('Lawsuit.', ['lawsuit']).correct).toBe(true);
    expect(judge('ほけん', ['保険', 'ほけん', 'hoken']).correct).toBe(true);
    expect(judge('hoken', ['保険', 'ほけん', 'hoken']).correct).toBe(true);
    expect(judge('', ['lawsuit']).correct).toBe(false);
    expect(judge('lawsut', ['lawsuit']).correct).toBe(false);
  });

  it('aceita sem acento, avisando', () => {
    expect(judge('demanda judicial', ['demanda judicial'])).toEqual({ correct: true, accentsOff: false });
    expect(judge('accion', ['acción'])).toEqual({ correct: true, accentsOff: true });
  });

  it('acertar conta uma escrita e a terceira fecha o dia', () => {
    let state = fresh;
    let outcome = applyTouch(state, true);
    expect(outcome.touches).toBe(1);
    state = outcome;
    outcome = applyTouch(state, true);
    state = outcome;
    outcome = applyTouch(state, true);
    expect(outcome.touches).toBe(TOUCHES_PER_DAY);
    expect(outcome.dayDone).toBe(true);
  });

  it('errar ao copiar não conta como falha', () => {
    expect(applyTouch(fresh, false)).toMatchObject({ touches: 0, misses: 0, relearn: false });
  });

  it('dois erros seguidos de memória voltam para olhar e copiar', () => {
    const afterOne = applyTouch({ ...fresh, touches: 1 }, false);
    expect(afterOne).toMatchObject({ touches: 1, misses: 1, relearn: false });
    const afterTwo = applyTouch(afterOne, false);
    expect(afterTwo).toMatchObject({ touches: 0, misses: 0, relearn: true });
  });

  it('um acerto zera a sequência de erros', () => {
    const missed = applyTouch({ ...fresh, touches: 1 }, false);
    expect(applyTouch(missed, true).misses).toBe(0);
  });
});
