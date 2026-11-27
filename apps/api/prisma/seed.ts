import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { assertConsistent, contentSchema, languageSchema, planLevels } from './content-schema';

const TRANSIENT = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024', 'P2028']);

// Conexões com o Neon caem de vez em quando (suspensão, limite de conexões). Todas as gravações
// do seed são idempotentes, então repetir a operação com espera crescente é seguro.
async function withRetry<T>(operation: () => Promise<T>, attempts = 6): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (attempt >= attempts || !code || !TRANSIENT.has(code)) throw error;
      await new Promise((done) => setTimeout(done, 1000 * attempt));
    }
  }
}

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
    await withRetry(() => prisma.$connect());
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
    // Sem transação única: com milhares de termos ela estoura o tempo limite. Todas as
    // operações são upserts/substituições idempotentes, então repetir o seed é seguro.
    const counts = await (async (tx: PrismaClient) => {
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
            const termIds = new Map<string, string>();

            const seedTerm = async (termInput: (typeof lessonInput.terms)[number], index: number) => {
              const term = await tx.term.upsert({
                where: { slug: termInput.slug },
                create: { slug: termInput.slug, domain: track.profession, status },
                update: { domain: track.profession, status },
              });

              await Promise.all(
                Object.entries(termInput.locales).map(([key, locale]) => {
                  const language = languageSchema.parse(key);
                  return tx.termLocale.upsert({
                    where: { termId_language: { termId: term.id, language } },
                    create: { termId: term.id, language, ...locale },
                    update: locale,
                  });
                }),
              );

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

              termIds.set(termInput.slug, term.id);
              lessonTerms.push({ lessonId: lesson.id, termId: term.id, position: index + 1 });
              termCount++;
            };

            const entries = [...lessonInput.terms.entries()];
            for (let i = 0; i < entries.length; i += 4) {
              await Promise.all(
                entries.slice(i, i + 4).map(([index, termInput]) => withRetry(() => seedTerm(termInput, index))),
              );
            }
            lessonTerms.sort((a, b) => a.position - b.position);

            await withRetry(async () => {
              await tx.lessonTerm.deleteMany({ where: { lessonId: lesson.id } });
              await tx.lessonTerm.createMany({ data: lessonTerms });

              const planned = planLevels(lessonInput);
              for (const [index, plan] of planned.entries()) {
                const position = index + 1;
                const level = await tx.level.upsert({
                  where: { lessonId_position: { lessonId: lesson.id, position } },
                  create: { lessonId: lesson.id, position, title: plan.title },
                  update: { title: plan.title },
                });
                await tx.levelTerm.deleteMany({ where: { levelId: level.id } });
                await tx.levelTerm.createMany({
                  data: plan.terms.map((t, i) => ({
                    levelId: level.id,
                    termId: termIds.get(t.slug) as string,
                    position: i + 1,
                  })),
                });
              }
              await tx.level.deleteMany({ where: { lessonId: lesson.id, position: { gt: planned.length } } });
            });
          }
        }

        return { termCount, morphemeCount: morphemeIds.size };
    })(prisma);

    console.log(
      `Seed concluído (${content.track.slug}): ${counts.termCount} termos, ${counts.morphemeCount} morfemas.`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
