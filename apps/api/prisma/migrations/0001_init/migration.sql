-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('PT', 'EN', 'ES', 'FR', 'ZH', 'JA');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "PartOfSpeech" AS ENUM ('NOUN', 'VERB', 'ADJECTIVE', 'ADVERB', 'PHRASE');

-- CreateEnum
CREATE TYPE "AudioStatus" AS ENUM ('NONE', 'PENDING', 'READY');

-- CreateEnum
CREATE TYPE "MorphemeKind" AS ENUM ('PREFIX', 'ROOT', 'SUFFIX');

-- CreateEnum
CREATE TYPE "Etymology" AS ENUM ('GREEK', 'LATIN', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "interfaceLanguage" "Language" NOT NULL DEFAULT 'PT',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_stats" (
    "userId" UUID NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveOn" VARCHAR(10),

    CONSTRAINT "user_stats_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "tracks" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "sourceLanguage" "Language" NOT NULL,
    "targetLanguage" "Language" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "trackId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" UUID NOT NULL,
    "unitId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "term_locales" (
    "id" UUID NOT NULL,
    "termId" UUID NOT NULL,
    "language" "Language" NOT NULL,
    "text" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "informalForms" TEXT[],
    "partOfSpeech" "PartOfSpeech" NOT NULL DEFAULT 'NOUN',
    "ipa" TEXT,
    "audioUrl" TEXT,
    "audioStatus" "AudioStatus" NOT NULL DEFAULT 'NONE',

    CONSTRAINT "term_locales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examples" (
    "id" UUID NOT NULL,
    "termId" UUID NOT NULL,
    "language" "Language" NOT NULL,
    "sentence" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "documentType" TEXT,

    CONSTRAINT "examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "morphemes" (
    "id" UUID NOT NULL,
    "form" TEXT NOT NULL,
    "kind" "MorphemeKind" NOT NULL,
    "origin" "Etymology" NOT NULL,
    "meanings" JSONB NOT NULL,

    CONSTRAINT "morphemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "term_morphemes" (
    "termId" UUID NOT NULL,
    "language" "Language" NOT NULL,
    "position" INTEGER NOT NULL,
    "segment" TEXT NOT NULL,
    "morphemeId" UUID NOT NULL,

    CONSTRAINT "term_morphemes_pkey" PRIMARY KEY ("termId","language","position")
);

-- CreateTable
CREATE TABLE "lesson_terms" (
    "lessonId" UUID NOT NULL,
    "termId" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "lesson_terms_pkey" PRIMARY KEY ("lessonId","termId")
);

-- CreateTable
CREATE TABLE "lesson_completions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "lessonId" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "xpEarned" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_cards" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "termId" UUID NOT NULL,
    "trackId" UUID NOT NULL,
    "due" TIMESTAMP(3) NOT NULL,
    "stability" DOUBLE PRECISION NOT NULL,
    "difficulty" DOUBLE PRECISION NOT NULL,
    "elapsedDays" INTEGER NOT NULL,
    "scheduledDays" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "lapses" INTEGER NOT NULL,
    "state" INTEGER NOT NULL,
    "lastReview" TIMESTAMP(3),

    CONSTRAINT "review_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tracks_slug_key" ON "tracks"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tracks_profession_sourceLanguage_targetLanguage_key" ON "tracks"("profession", "sourceLanguage", "targetLanguage");

-- CreateIndex
CREATE INDEX "units_trackId_position_idx" ON "units"("trackId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "units_trackId_slug_key" ON "units"("trackId", "slug");

-- CreateIndex
CREATE INDEX "lessons_unitId_position_idx" ON "lessons"("unitId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_unitId_slug_key" ON "lessons"("unitId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "terms_slug_key" ON "terms"("slug");

-- CreateIndex
CREATE INDEX "terms_domain_status_idx" ON "terms"("domain", "status");

-- CreateIndex
CREATE UNIQUE INDEX "term_locales_termId_language_key" ON "term_locales"("termId", "language");

-- CreateIndex
CREATE INDEX "examples_termId_language_idx" ON "examples"("termId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "morphemes_form_key" ON "morphemes"("form");

-- CreateIndex
CREATE INDEX "term_morphemes_morphemeId_idx" ON "term_morphemes"("morphemeId");

-- CreateIndex
CREATE INDEX "lesson_terms_lessonId_position_idx" ON "lesson_terms"("lessonId", "position");

-- CreateIndex
CREATE INDEX "lesson_completions_userId_lessonId_idx" ON "lesson_completions"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "review_cards_userId_trackId_due_idx" ON "review_cards"("userId", "trackId", "due");

-- CreateIndex
CREATE UNIQUE INDEX "review_cards_userId_termId_trackId_key" ON "review_cards"("userId", "termId", "trackId");

-- AddForeignKey
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "term_locales" ADD CONSTRAINT "term_locales_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examples" ADD CONSTRAINT "examples_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "term_morphemes" ADD CONSTRAINT "term_morphemes_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "term_morphemes" ADD CONSTRAINT "term_morphemes_morphemeId_fkey" FOREIGN KEY ("morphemeId") REFERENCES "morphemes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_terms" ADD CONSTRAINT "lesson_terms_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_terms" ADD CONSTRAINT "lesson_terms_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_cards" ADD CONSTRAINT "review_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_cards" ADD CONSTRAINT "review_cards_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_cards" ADD CONSTRAINT "review_cards_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

