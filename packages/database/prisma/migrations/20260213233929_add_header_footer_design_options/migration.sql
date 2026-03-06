-- AlterTable
ALTER TABLE "RestaurantTheme" ADD COLUMN     "headerBgOpacity" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "headerSticky" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "headerTextColor" TEXT NOT NULL DEFAULT '#FFFFFF',
ADD COLUMN     "headerTransparent" BOOLEAN NOT NULL DEFAULT false;
