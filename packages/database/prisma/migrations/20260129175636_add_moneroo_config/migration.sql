-- AlterTable
ALTER TABLE "ClientPayment" ALTER COLUMN "currency" SET DEFAULT 'XOF';

-- AlterTable
ALTER TABLE "ResellerOrganization" ADD COLUMN     "monerooConfigured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "monerooPublicKey" TEXT,
ADD COLUMN     "monerooSecretKey" TEXT,
ADD COLUMN     "monerooWebhookSecret" TEXT;

-- AlterTable
ALTER TABLE "RestaurantSettings" ADD COLUMN     "monerooConfigured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "monerooPublicKey" TEXT,
ADD COLUMN     "monerooSecretKey" TEXT,
ADD COLUMN     "monerooWebhookSecret" TEXT,
ALTER COLUMN "currency" SET DEFAULT 'XOF';

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "currency" SET DEFAULT 'XOF';
