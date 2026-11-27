import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertConsistent, contentSchema, planLevels } from '../prisma/content-schema';

const dir = join(__dirname, '..', 'prisma', 'content');
const files = readdirSync(dir).filter((name) => name.endsWith('.json'));
const contents = files.map((name) => ({
  name,
  data: contentSchema.parse(JSON.parse(readFileSync(join(dir, name), 'utf-8'))),
}));

const termsOf = (c: (typeof contents)[number]['data']) =>
  c.units.flatMap((u) => u.lessons.flatMap((l) => l.terms));

describe('conteúdo (seed)', () => {
  it('há ao menos uma trilha', () => {
    expect(contents.length).toBeGreaterThan(0);
  });

  it.each(contents)('$name passa na validação do seed', ({ data }) => {
    expect(() => assertConsistent(data)).not.toThrow();
  });

  // As trilhas em outros idiomas reaproveitam os termos do inglês (mesmo slug, novo idioma).
  // Por isso a unicidade vale dentro de cada idioma.
  it('slugs de termos são únicos dentro de cada idioma', () => {
    for (const language of new Set(contents.map(({ data }) => data.track.targetLanguage))) {
      const slugs = contents
        .filter(({ data }) => data.track.targetLanguage === language)
        .flatMap(({ data }) => termsOf(data).map((t) => t.slug));
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it('slugs de trilha e de profissão são únicos', () => {
    const slugs = contents.map(({ data }) => data.track.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  describe.each(contents)('$name', ({ name, data }) => {
    const terms = termsOf(data);
    const target = data.track.targetLanguage;

    // Os alfabetos (hiragana/katakana) ainda não têm nota de uso, combinações e exemplos.
    const isAlphabet = /hiragana|katakana/.test(String(name));
    const teachesUsage = !isAlphabet && ['EN', 'ES', 'DE', 'JA', 'ZH'].includes(target);

    (teachesUsage ? it : it.skip)('cada termo ensina o uso: nota, combinações e dois exemplos', () => {
      for (const term of terms) {
        const locale = term.locales[target];
        expect(`${term.slug}: ${locale.usageNote ?? ''}`.length).toBeGreaterThan(term.slug.length + 20);
        expect(locale.collocations.length).toBeGreaterThanOrEqual(2);
        expect(term.examples.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('o trecho omitido nos exemplos é exatamente o termo e aparece uma única vez', () => {
      for (const term of terms) {
        for (const example of term.examples) {
          expect(example.answer).toBe(term.locales[target].text);
          expect(example.sentence.split(example.answer)).toHaveLength(2);
        }
      }
    });

    it('cada lição tem ao menos 4 termos e os níveis respeitam o tamanho', () => {
      for (const unit of data.units) {
        for (const lesson of unit.lessons) {
          expect(lesson.terms.length).toBeGreaterThanOrEqual(4);
          const levels = planLevels(lesson);
          expect(levels.flatMap((l) => l.terms.map((t) => t.slug)).sort()).toEqual(
            lesson.terms.map((t) => t.slug).sort(),
          );
          for (const level of levels) {
            // Níveis declarados no JSON ficam entre 3 e 4; a divisão automática aceita 2 só no resto de 5 termos.
            expect(level.terms.length).toBeGreaterThanOrEqual(lesson.levels ? 3 : 2);
            expect(level.terms.length).toBeLessThanOrEqual(4);
          }
        }
      }
    });

    it('posições de unidades e lições são sequenciais', () => {
      expect(data.units.map((u) => u.position)).toEqual(data.units.map((_, i) => i + 1));
      for (const unit of data.units) {
        expect(unit.lessons.map((l) => l.position)).toEqual(unit.lessons.map((_, i) => i + 1));
      }
    });
  });
});
