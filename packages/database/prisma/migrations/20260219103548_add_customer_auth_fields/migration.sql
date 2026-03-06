-- AlterTable
ALTER TABLE "RestaurantCustomer" ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT;

-- CreateIndex
CREATE INDEX "RestaurantCustomer_emailVerificationToken_idx" ON "RestaurantCustomer"("emailVerificationToken");

-- CreateIndex
CREATE INDEX "RestaurantCustomer_passwordResetToken_idx" ON "RestaurantCustomer"("passwordResetToken");
