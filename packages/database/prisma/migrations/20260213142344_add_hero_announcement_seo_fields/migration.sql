-- AlterTable
ALTER TABLE "RestaurantSettings" ADD COLUMN     "favicon" TEXT,
ADD COLUMN     "ogImage" TEXT;

-- AlterTable
ALTER TABLE "RestaurantTheme" ADD COLUMN     "announcementLink" TEXT,
ADD COLUMN     "heroCtaLink" TEXT,
ADD COLUMN     "heroImageUrl" TEXT,
ADD COLUMN     "heroImages" JSONB,
ADD COLUMN     "heroVideoUrl" TEXT;
