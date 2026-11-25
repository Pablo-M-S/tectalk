import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertConsistent, contentSchema } from '../prisma/content-schema';

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

  it('slugs de termos são únicos entre todos os arquivos', () => {
    const slugs = contents.flatMap(({ data }) => termsOf(data).map((t) => t.slug));
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('slugs de trilha e de profissão são únicos', () => {
    const slugs = contents.map(({ data }) => data.track.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  describe.each(contents)('$name', ({ data }) => {
    const terms = termsOf(data);
    const target = data.track.targetLanguage;

    it('cada termo ensina o uso: nota, combinações e dois exemplos', () => {
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

    it('as lições têm de 4 a 8 termos', () => {
      for (const unit of data.units) {
        for (const lesson of unit.lessons) {
          expect(lesson.terms.length).toBeGreaterThanOrEqual(4);
          expect(lesson.terms.length).toBeLessThanOrEqual(8);
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
