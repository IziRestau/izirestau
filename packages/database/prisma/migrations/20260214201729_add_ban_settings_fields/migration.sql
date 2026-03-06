-- AlterTable
ALTER TABLE "StoreBanner" ADD COLUMN     "pages" TEXT[] DEFAULT ARRAY['home']::TEXT[],
ADD COLUMN     "position" TEXT NOT NULL DEFAULT 'hero';
