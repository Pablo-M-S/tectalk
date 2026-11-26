-- CreateEnum
CREATE TYPE "NotebookStatus" AS ENUM ('LEARNING', 'MASTERED');

-- CreateTable
CREATE TABLE "notebook_entries" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "termId" UUID NOT NULL,
    "trackId" UUID NOT NULL,
    "status" "NotebookStatus" NOT NULL DEFAULT 'LEARNING',
    "touches" INTEGER NOT NULL DEFAULT 0,
    "touchDay" TEXT NOT NULL DEFAULT '',
    "misses" INTEGER NOT NULL DEFAULT 0,
    "masteredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notebook_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notebook_entries_userId_trackId_status_idx" ON "notebook_entries"("userId", "trackId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "notebook_entries_userId_termId_trackId_key" ON "notebook_entries"("userId", "termId", "trackId");

-- AddForeignKey
ALTER TABLE "notebook_entries" ADD CONSTRAINT "notebook_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notebook_entries" ADD CONSTRAINT "notebook_entries_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notebook_entries" ADD CONSTRAINT "notebook_entries_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
