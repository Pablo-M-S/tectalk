-- CreateEnum
CREATE TYPE "ProficiencyLevel" AS ENUM ('BEGINNER', 'BASIC', 'INTERMEDIATE', 'ADVANCED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "dailyGoalMinutes" INTEGER,
ADD COLUMN     "level" "ProficiencyLevel",
ADD COLUMN     "onboardedAt" TIMESTAMP(3),
ADD COLUMN     "profession" TEXT,
ADD COLUMN     "remindersEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "targetLanguage" "Language" NOT NULL DEFAULT 'EN';
