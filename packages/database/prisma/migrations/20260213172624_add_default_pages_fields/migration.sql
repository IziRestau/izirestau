-- AlterTable
ALTER TABLE "StorePage" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pageType" TEXT;
