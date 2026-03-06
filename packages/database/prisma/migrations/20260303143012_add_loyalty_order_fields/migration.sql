-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "loyaltyDiscount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "loyaltyPointsUsed" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "RestaurantSettings" ADD COLUMN     "loyaltyEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "loyaltyPointsPerUnit" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "loyaltyPointsToMoneyRate" INTEGER NOT NULL DEFAULT 100;
