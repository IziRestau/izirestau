/*
  Migration: Remplacer SCHEDULED par PENDING dans EmailCampaignStatus
  - SCHEDULED est retiré
  - PENDING est ajouté pour les campagnes programmées (prêtes à être envoyées)
*/

-- Convertir les campagnes SCHEDULED en PENDING (elles gardent leur scheduledAt)
UPDATE "EmailCampaign" SET "status" = 'DRAFT' WHERE "status" = 'SCHEDULED';

-- AlterEnum: Remplacer SCHEDULED par PENDING
BEGIN;
CREATE TYPE "EmailCampaignStatus_new" AS ENUM ('DRAFT', 'PENDING', 'SENDING', 'SENT', 'CANCELLED');
ALTER TABLE "EmailCampaign" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "EmailCampaign" ALTER COLUMN "status" TYPE "EmailCampaignStatus_new" USING ("status"::text::"EmailCampaignStatus_new");
ALTER TYPE "EmailCampaignStatus" RENAME TO "EmailCampaignStatus_old";
ALTER TYPE "EmailCampaignStatus_new" RENAME TO "EmailCampaignStatus";
DROP TYPE "EmailCampaignStatus_old";
ALTER TABLE "EmailCampaign" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- Mettre à jour les campagnes DRAFT avec scheduledAt en PENDING
UPDATE "EmailCampaign" SET "status" = 'PENDING' WHERE "status" = 'DRAFT' AND "scheduledAt" IS NOT NULL;
