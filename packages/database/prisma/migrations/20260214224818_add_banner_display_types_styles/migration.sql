-- AlterTable
ALTER TABLE "StoreBanner" ADD COLUMN     "contentMode" TEXT NOT NULL DEFAULT 'simple',
ADD COLUMN     "couponId" TEXT,
ADD COLUMN     "dismissable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "displayType" TEXT NOT NULL DEFAULT 'banner',
ADD COLUMN     "sticky" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "styles" JSONB,
ALTER COLUMN "image" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "StoreBanner" ADD CONSTRAINT "StoreBanner_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
