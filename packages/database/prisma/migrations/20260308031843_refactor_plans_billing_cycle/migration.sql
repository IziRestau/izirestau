/*
  Warnings:

  - You are about to drop the column `features` on the `ResellerPlan` table. All the data in the column will be lost.
  - You are about to drop the column `priceMonthly` on the `ResellerPlan` table. All the data in the column will be lost.
  - You are about to drop the column `priceYearly` on the `ResellerPlan` table. All the data in the column will be lost.
  - The `billingCycle` column on the `ShowcasePayment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `price` to the `ResellerPlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ResellerPlan" DROP COLUMN "features",
DROP COLUMN "priceMonthly",
DROP COLUMN "priceYearly",
ADD COLUMN     "billingCycle" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "billingCycleLabel" TEXT,
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "ShowcasePayment" DROP COLUMN "billingCycle",
ADD COLUMN     "billingCycle" INTEGER NOT NULL DEFAULT 1;
