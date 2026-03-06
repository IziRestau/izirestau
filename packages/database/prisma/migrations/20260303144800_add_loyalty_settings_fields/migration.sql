-- AlterTable
ALTER TABLE "RestaurantSettings" ADD COLUMN     "loyaltyBirthdayBonus" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "loyaltyMinPointsToRedeem" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "loyaltyReferralBonus" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "loyaltyWelcomeBonus" INTEGER NOT NULL DEFAULT 0;
