-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifyEmailInvoice" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyEmailMarketing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyEmailNewClient" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyEmailNewSite" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyEmailPayment" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyEmailWeeklyReport" BOOLEAN NOT NULL DEFAULT true;
