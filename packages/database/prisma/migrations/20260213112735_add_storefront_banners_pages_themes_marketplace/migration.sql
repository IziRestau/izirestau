-- CreateEnum
CREATE TYPE "ThemeCategory" AS ENUM ('RESTAURANT', 'FAST_FOOD', 'CAFE', 'BAKERY', 'BAR', 'FINE_DINING', 'FOOD_TRUCK', 'UNIVERSAL');

-- AlterTable
ALTER TABLE "RestaurantTheme" ADD COLUMN     "legalText" TEXT,
ADD COLUMN     "navigationConfig" JSONB,
ADD COLUMN     "privacyText" TEXT,
ADD COLUMN     "showAboutPage" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showContactPage" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showGallery" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showMap" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showNewsletter" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showTestimonials" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "StoreBanner" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "image" TEXT NOT NULL,
    "ctaText" TEXT,
    "ctaLink" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreBanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorePage" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "showInNav" BOOLEAN NOT NULL DEFAULT true,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "author" TEXT NOT NULL DEFAULT 'IziResto',
    "previewImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thumbnailUrl" TEXT,
    "demoUrl" TEXT,
    "category" "ThemeCategory" NOT NULL DEFAULT 'RESTAURANT',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "price" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "installCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "supportedPages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "colorPresets" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThemeInstallation" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customizations" JSONB,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThemeInstallation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoreBanner_restaurantId_idx" ON "StoreBanner"("restaurantId");

-- CreateIndex
CREATE INDEX "StoreBanner_sortOrder_idx" ON "StoreBanner"("sortOrder");

-- CreateIndex
CREATE INDEX "StorePage_restaurantId_idx" ON "StorePage"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "StorePage_restaurantId_slug_key" ON "StorePage"("restaurantId", "slug");

-- CreateIndex
CREATE INDEX "ContactMessage_restaurantId_idx" ON "ContactMessage"("restaurantId");

-- CreateIndex
CREATE INDEX "ContactMessage_isRead_idx" ON "ContactMessage"("isRead");

-- CreateIndex
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Theme_slug_key" ON "Theme"("slug");

-- CreateIndex
CREATE INDEX "Theme_category_idx" ON "Theme"("category");

-- CreateIndex
CREATE INDEX "Theme_isFeatured_idx" ON "Theme"("isFeatured");

-- CreateIndex
CREATE INDEX "Theme_isActive_idx" ON "Theme"("isActive");

-- CreateIndex
CREATE INDEX "ThemeInstallation_restaurantId_idx" ON "ThemeInstallation"("restaurantId");

-- CreateIndex
CREATE INDEX "ThemeInstallation_themeId_idx" ON "ThemeInstallation"("themeId");

-- CreateIndex
CREATE UNIQUE INDEX "ThemeInstallation_restaurantId_themeId_key" ON "ThemeInstallation"("restaurantId", "themeId");

-- AddForeignKey
ALTER TABLE "StoreBanner" ADD CONSTRAINT "StoreBanner_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorePage" ADD CONSTRAINT "StorePage_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeInstallation" ADD CONSTRAINT "ThemeInstallation_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeInstallation" ADD CONSTRAINT "ThemeInstallation_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
