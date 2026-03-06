/*
  Warnings:

  - A unique constraint covering the columns `[customDomain]` on the table `ResellerOrganization` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ResellerOrganization" ADD COLUMN     "customDomain" TEXT,
ADD COLUMN     "domainTxtRecord" TEXT,
ADD COLUMN     "domainVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "domainVerifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "twoFactorBackupCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT,
ADD COLUMN     "twoFactorVerifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "ResellerOrganization_customDomain_key" ON "ResellerOrganization"("customDomain");
