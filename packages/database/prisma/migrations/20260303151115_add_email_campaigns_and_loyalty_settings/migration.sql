-- CreateEnum
CREATE TYPE "EmailCampaignType" AS ENUM ('PROMOTIONAL', 'NEWSLETTER', 'ANNOUNCEMENT', 'LOYALTY', 'BIRTHDAY', 'REACTIVATION');

-- CreateEnum
CREATE TYPE "EmailCampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EmailRecipientStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "RestaurantEmailType" AS ENUM ('ORDER_CONFIRMATION', 'ORDER_READY', 'ORDER_DELIVERED', 'LOYALTY_POINTS_EARNED', 'LOYALTY_POINTS_REDEEMED', 'WELCOME', 'BIRTHDAY', 'RECEIPT');

-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "EmailCampaignType" NOT NULL DEFAULT 'PROMOTIONAL',
    "status" "EmailCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "targetAll" BOOLEAN NOT NULL DEFAULT true,
    "targetSegment" TEXT,
    "targetMinPoints" INTEGER,
    "targetMaxPoints" INTEGER,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCampaignRecipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "EmailRecipientStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),

    CONSTRAINT "EmailCampaignRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantEmailTemplate" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "type" "RestaurantEmailType" NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantEmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailCampaign_restaurantId_idx" ON "EmailCampaign"("restaurantId");

-- CreateIndex
CREATE INDEX "EmailCampaign_status_idx" ON "EmailCampaign"("status");

-- CreateIndex
CREATE INDEX "EmailCampaignRecipient_campaignId_idx" ON "EmailCampaignRecipient"("campaignId");

-- CreateIndex
CREATE INDEX "EmailCampaignRecipient_customerId_idx" ON "EmailCampaignRecipient"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailCampaignRecipient_campaignId_customerId_key" ON "EmailCampaignRecipient"("campaignId", "customerId");

-- CreateIndex
CREATE INDEX "RestaurantEmailTemplate_restaurantId_idx" ON "RestaurantEmailTemplate"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantEmailTemplate_restaurantId_type_key" ON "RestaurantEmailTemplate"("restaurantId", "type");

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaignRecipient" ADD CONSTRAINT "EmailCampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaignRecipient" ADD CONSTRAINT "EmailCampaignRecipient_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "RestaurantCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantEmailTemplate" ADD CONSTRAINT "RestaurantEmailTemplate_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
