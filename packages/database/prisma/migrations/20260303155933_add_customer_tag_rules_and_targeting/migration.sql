-- AlterTable
ALTER TABLE "EmailCampaign" ADD COLUMN     "targetingRules" JSONB;

-- CreateTable
CREATE TABLE "CustomerTagRule" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB NOT NULL,
    "triggerOnOrder" BOOLEAN NOT NULL DEFAULT true,
    "customersMatched" INTEGER NOT NULL DEFAULT 0,
    "lastEvaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerTagRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerTagRule_restaurantId_idx" ON "CustomerTagRule"("restaurantId");

-- CreateIndex
CREATE INDEX "CustomerTagRule_isActive_idx" ON "CustomerTagRule"("isActive");

-- AddForeignKey
ALTER TABLE "CustomerTagRule" ADD CONSTRAINT "CustomerTagRule_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
