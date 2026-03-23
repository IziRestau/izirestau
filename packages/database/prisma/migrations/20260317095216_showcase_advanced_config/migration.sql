-- AlterTable
ALTER TABLE "ResellerShowcase" ADD COLUMN     "benefitsConfig" JSONB,
ADD COLUMN     "contactConfig" JSONB,
ADD COLUMN     "faqConfig" JSONB,
ADD COLUMN     "footerConfig" JSONB,
ADD COLUMN     "globalStyles" JSONB,
ADD COLUMN     "heroConfig" JSONB,
ADD COLUMN     "howItWorksConfig" JSONB,
ADD COLUMN     "pricingConfig" JSONB,
ADD COLUMN     "productConfig" JSONB,
ADD COLUMN     "sectionsOrder" JSONB,
ADD COLUMN     "template" TEXT NOT NULL DEFAULT 'modern',
ADD COLUMN     "testimonialsConfig" JSONB;
