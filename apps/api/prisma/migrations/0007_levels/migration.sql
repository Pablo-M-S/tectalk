-- CreateTable
CREATE TABLE "levels" (
    "id" UUID NOT NULL,
    "lessonId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT,

    CONSTRAINT "levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "level_terms" (
    "levelId" UUID NOT NULL,
    "termId" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "level_terms_pkey" PRIMARY KEY ("levelId","termId")
);

-- AlterTable
ALTER TABLE "lesson_completions" ADD COLUMN "levelId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "levels_lessonId_position_key" ON "levels"("lessonId", "position");

-- CreateIndex
CREATE INDEX "level_terms_levelId_position_idx" ON "level_terms"("levelId", "position");

-- CreateIndex
CREATE INDEX "lesson_completions_userId_levelId_idx" ON "lesson_completions"("userId", "levelId");

-- AddForeignKey
ALTER TABLE "levels" ADD CONSTRAINT "levels_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_terms" ADD CONSTRAINT "level_terms_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_terms" ADD CONSTRAINT "level_terms_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
