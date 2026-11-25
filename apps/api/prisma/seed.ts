import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { assertConsistent, contentSchema, languageSchema } from './content-schema';

async function main(): Promise<void> {
  const contentDir = join(__dirname, 'content');
  const files = process.argv[2]
    ? [resolve(process.argv[2])]
    : readdirSync(contentDir)
        .filter((name) => name.endsWith('.json'))
        .sort()
        .map((name) => join(contentDir, name));

  const prisma = new PrismaClient();
  try {
    for (const file of files) {
      await seedFile(prisma, file);
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function seedFile(prisma: PrismaClient, file: string): Promise<void> {
  const content = contentSchema.parse(JSON.parse(readFileSync(file, 'utf-8')));
  assertConsistent(content);

  {
    const counts = await prisma.$transaction(
      async (tx) => {
        const status = content.status;
        const trackData = { ...content.track, status };
        const track = await tx.track.upsert({
          where: { slug: content.track.slug },
          create: trackData,
          update: trackData,
        });

        const morphemeIds = new Map<string, string>();
        for (const m of content.morphemes) {
          const row = await tx.morpheme.upsert({
            where: { form: m.form },
            create: m,
            update: { kind: m.kind, origin: m.origin, meanings: m.meanings },
          });
          morphemeIds.set(m.form, row.id);
        }

        let termCount = 0;
        for (const unitInput of content.units) {
          const unit = await tx.unit.upsert({
            where: { trackId_slug: { trackId: track.id, slug: unitInput.slug } },
            create: {
              trackId: track.id,
              slug: unitInput.slug,
              title: unitInput.title,
              position: unitInput.position,
            },
            update: { title: unitInput.title, position: unitInput.position },
          });

          for (const lessonInput of unitInput.lessons) {
            const lesson = await tx.lesson.upsert({
              where: { unitId_slug: { unitId: unit.id, slug: lessonInput.slug } },
              create: {
                unitId: unit.id,
                slug: lessonInput.slug,
                title: lessonInput.title,
                position: lessonInput.position,
                status,
              },
              update: { title: lessonInput.title, position: lessonInput.position, status },
            });

            const lessonTerms: { lessonId: string; termId: string; position: number }[] = [];

            for (const [index, termInput] of lessonInput.terms.entries()) {
              const term = await tx.term.upsert({
                where: { slug: termInput.slug },
                create: { slug: termInput.slug, domain: track.profession, status },
                update: { domain: track.profession, status },
              });

              for (const [key, locale] of Object.entries(termInput.locales)) {
                const language = languageSchema.parse(key);
                await tx.termLocale.upsert({
                  where: { termId_language: { termId: term.id, language } },
                  create: { termId: term.id, language, ...locale },
                  update: locale,
                });
              }

              await tx.example.deleteMany({ where: { termId: term.id, language: content.track.targetLanguage } });
              if (termInput.examples.length > 0) {
                await tx.example.createMany({
                  data: termInput.examples.map((e) => ({ termId: term.id, ...e })),
                });
              }

              await tx.termMorpheme.deleteMany({ where: { termId: term.id, language: content.track.targetLanguage } });
              for (const [key, parts] of Object.entries(termInput.segments)) {
                const language = languageSchema.parse(key);
                await tx.termMorpheme.createMany({
                  data: parts.map((part, position) => ({
                    termId: term.id,
                    language,
                    position,
                    segment: part.segment,
                    morphemeId: morphemeIds.get(part.morpheme) as string,
                  })),
                });
              }

              lessonTerms.push({ lessonId: lesson.id, termId: term.id, position: index + 1 });
              termCount++;
            }

            await tx.lessonTerm.deleteMany({ where: { lessonId: lesson.id } });
            await tx.lessonTerm.createMany({ data: lessonTerms });
          }
        }

        return { termCount, morphemeCount: morphemeIds.size };
      },
      { timeout: 120_000, maxWait: 20_000 },
    );

    console.log(
      `Seed concluído (${content.track.slug}): ${counts.termCount} termos, ${counts.morphemeCount} morfemas.`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
