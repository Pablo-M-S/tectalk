import {
  ContentStatus,
  Etymology,
  Language,
  MorphemeKind,
  PartOfSpeech,
} from '@prisma/client';
import { z } from 'zod';

export const languageSchema = z.nativeEnum(Language);

const localeSchema = z.object({
  text: z.string().min(1),
  definition: z.string().default(''),
  informalForms: z.array(z.string()).default([]),
  partOfSpeech: z.nativeEnum(PartOfSpeech).default(PartOfSpeech.NOUN),
  ipa: z.string().optional(),
  usageNote: z.string().optional(),
  collocations: z.array(z.string()).default([]),
});

const termSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  locales: z.record(z.string(), localeSchema),
  examples: z
    .array(
      z.object({
        language: z.nativeEnum(Language),
        sentence: z.string().min(1),
        answer: z.string().min(1),
        documentType: z.string().optional(),
      }),
    )
    .default([]),
  segments: z
    .record(z.string(), z.array(z.object({ segment: z.string().min(1), morpheme: z.string().min(1) })))
    .default({}),
});

export const contentSchema = z.object({
  status: z.nativeEnum(ContentStatus),
  track: z.object({
    slug: z.string(),
    profession: z.string(),
    sourceLanguage: z.nativeEnum(Language),
    targetLanguage: z.nativeEnum(Language),
    title: z.string(),
    description: z.string(),
    position: z.number().int(),
  }),
  morphemes: z.array(
    z.object({
      form: z.string(),
      kind: z.nativeEnum(MorphemeKind),
      origin: z.nativeEnum(Etymology),
      meanings: z.record(z.string(), z.string()),
    }),
  ),
  units: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
      position: z.number().int(),
      lessons: z.array(
        z.object({
          slug: z.string(),
          title: z.string(),
          position: z.number().int(),
          terms: z.array(termSchema),
        }),
      ),
    }),
  ),
});

export type Content = z.infer<typeof contentSchema>;

/** Falha cedo, com mensagem clara, se o JSON tiver inconsistência de conteúdo. */
export function assertConsistent(content: Content): void {
  const forms = new Set(content.morphemes.map((m) => m.form));
  const { sourceLanguage, targetLanguage } = content.track;
  const slugs = new Set<string>();

  for (const unit of content.units) {
    for (const lesson of unit.lessons) {
      for (const term of lesson.terms) {
        if (slugs.has(term.slug)) throw new Error(`Termo duplicado: ${term.slug}`);
        slugs.add(term.slug);

        for (const language of [sourceLanguage, targetLanguage]) {
          if (!term.locales[language]) {
            throw new Error(`Termo "${term.slug}" sem tradução em ${language}`);
          }
          if (language === sourceLanguage && !term.locales[language].definition) {
            throw new Error(`Termo "${term.slug}" sem definição em ${language}`);
          }
        }

        for (const example of term.examples) {
          if (!example.sentence.includes(example.answer)) {
            throw new Error(`Exemplo de "${term.slug}" não contém a resposta "${example.answer}"`);
          }
        }

        for (const [language, parts] of Object.entries(term.segments)) {
          const joined = parts.map((p) => p.segment).join('');
          const text = term.locales[language]?.text;
          if (joined !== text) {
            throw new Error(`Segmentos de "${term.slug}" (${language}) formam "${joined}", esperado "${text}"`);
          }
          for (const part of parts) {
            if (!forms.has(part.morpheme)) {
              throw new Error(`Morfema inexistente em "${term.slug}": ${part.morpheme}`);
            }
          }
        }
      }
    }
  }
}
