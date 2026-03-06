-- AlterTable
ALTER TABLE "MediaItem" ADD COLUMN     "description" TEXT,
ADD COLUMN     "title" TEXT;

-- CreateIndex
CREATE INDEX "MediaItem_folder_idx" ON "MediaItem"("folder");
