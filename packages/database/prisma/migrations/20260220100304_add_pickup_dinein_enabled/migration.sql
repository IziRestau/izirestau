-- AlterTable
ALTER TABLE "RestaurantSettings" ADD COLUMN     "dineInEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pickupEnabled" BOOLEAN NOT NULL DEFAULT true;
