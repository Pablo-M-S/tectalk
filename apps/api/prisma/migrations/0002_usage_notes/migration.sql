-- AlterTable
ALTER TABLE "term_locales" ADD COLUMN "collocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "usageNote" TEXT;
