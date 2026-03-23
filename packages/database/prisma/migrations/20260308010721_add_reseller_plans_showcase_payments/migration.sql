-- CreateEnum
CREATE TYPE "ShowcasePaymentStatus" AS ENUM ('PENDING', 'PAID', 'ONBOARDING', 'COMPLETED', 'EXPIRED', 'FAILED');

-- AlterTable
ALTER TABLE "ClientSubscription" ADD COLUMN     "planId" TEXT,
ADD COLUMN     "planSnapshot" JSONB,
ALTER COLUMN "currency" SET DEFAULT 'XOF';

-- CreateTable
CREATE TABLE "ResellerPlan" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "priceMonthly" DECIMAL(10,2) NOT NULL,
    "priceYearly" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResellerPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResellerShowcase" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "headline" TEXT,
    "subheadline" TEXT,
    "heroImage" TEXT,
    "ctaText" TEXT NOT NULL DEFAULT 'Commencer maintenant',
    "showPricing" BOOLEAN NOT NULL DEFAULT true,
    "showFeatures" BOOLEAN NOT NULL DEFAULT true,
    "showTestimonials" BOOLEAN NOT NULL DEFAULT false,
    "showFAQ" BOOLEAN NOT NULL DEFAULT false,
    "showContact" BOOLEAN NOT NULL DEFAULT true,
    "featuresContent" JSONB,
    "testimonials" JSONB,
    "faq" JSONB,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResellerShowcase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowcasePayment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "planId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "monerooPaymentId" TEXT,
    "monerooStatus" TEXT,
    "onboardingToken" TEXT NOT NULL,
    "onboardingExpires" TIMESTAMP(3) NOT NULL,
    "status" "ShowcasePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "clientId" TEXT,
    "siteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShowcasePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResellerPlan_organizationId_idx" ON "ResellerPlan"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ResellerPlan_organizationId_slug_key" ON "ResellerPlan"("organizationId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ResellerShowcase_organizationId_key" ON "ResellerShowcase"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ShowcasePayment_monerooPaymentId_key" ON "ShowcasePayment"("monerooPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "ShowcasePayment_onboardingToken_key" ON "ShowcasePayment"("onboardingToken");

-- CreateIndex
CREATE INDEX "ShowcasePayment_organizationId_idx" ON "ShowcasePayment"("organizationId");

-- CreateIndex
CREATE INDEX "ShowcasePayment_email_idx" ON "ShowcasePayment"("email");

-- CreateIndex
CREATE INDEX "ShowcasePayment_onboardingToken_idx" ON "ShowcasePayment"("onboardingToken");

-- CreateIndex
CREATE INDEX "ClientSubscription_planId_idx" ON "ClientSubscription"("planId");

-- AddForeignKey
ALTER TABLE "ResellerPlan" ADD CONSTRAINT "ResellerPlan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ResellerOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResellerShowcase" ADD CONSTRAINT "ResellerShowcase_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ResellerOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowcasePayment" ADD CONSTRAINT "ShowcasePayment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ResellerOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowcasePayment" ADD CONSTRAINT "ShowcasePayment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ResellerPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSubscription" ADD CONSTRAINT "ClientSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ResellerPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
