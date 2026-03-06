/*
  Warnings:

  - A unique constraint covering the columns `[restaurantId,userId]` on the table `RestaurantStaff` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "RestaurantStaff_userId_key";

-- CreateIndex
CREATE INDEX "RestaurantStaff_userId_idx" ON "RestaurantStaff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantStaff_restaurantId_userId_key" ON "RestaurantStaff"("restaurantId", "userId");
