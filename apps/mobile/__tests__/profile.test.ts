import { GOALS, LANGUAGES, LEVELS, languageLabel, levelLabel, professionLabel, PROFESSIONS } from '../src/lib/profile';

describe('catálogo de perfil', () => {
  it('só o inglês está disponível por enquanto', () => {
    expect(LANGUAGES.filter((l) => l.available).map((l) => l.code)).toEqual(['EN']);
  });

  it('slugs de profissão são únicos e incluem as áreas publicadas', () => {
    const slugs = PROFESSIONS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toEqual(expect.arrayContaining(['medicina', 'programacao', 'outra']));
  });

  it('metas diárias são crescentes', () => {
    const minutes = GOALS.map((g) => g.minutes);
    expect([...minutes].sort((a, b) => a - b)).toEqual(minutes);
  });

  it('rótulos têm valor de reserva', () => {
    expect(professionLabel('medicina')).toBe('Medicina e saúde');
    expect(professionLabel(null)).toBe('—');
    expect(levelLabel('BASIC')).toBe('Básico');
    expect(levelLabel(null)).toBe('—');
    expect(languageLabel('EN')).toBe('Inglês');
    expect(LEVELS).toHaveLength(4);
  });
});
