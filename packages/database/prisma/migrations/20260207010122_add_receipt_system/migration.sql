-- CreateEnum
CREATE TYPE "ReceiptType" AS ENUM ('TICKET', 'INVOICE_SIMPLE', 'INVOICE_FULL');

-- CreateTable
CREATE TABLE "ReceiptTemplate" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ReceiptType" NOT NULL,
    "htmlTemplate" TEXT NOT NULL,
    "thermalTemplate" TEXT,
    "cssStyles" TEXT,
    "previewImage" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceiptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "type" "ReceiptType" NOT NULL,
    "restaurantInfo" JSONB NOT NULL,
    "customerInfo" JSONB,
    "items" JSONB NOT NULL,
    "totals" JSONB NOT NULL,
    "signature" TEXT,
    "previousHash" TEXT,
    "pdfUrl" TEXT,
    "pdfGeneratedAt" TIMESTAMP(3),
    "emailSentAt" TIMESTAMP(3),
    "emailSentTo" TEXT,
    "printedAt" TIMESTAMP(3),
    "printedBy" TEXT,
    "isVoided" BOOLEAN NOT NULL DEFAULT false,
    "voidedAt" TIMESTAMP(3),
    "voidedBy" TEXT,
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptSettings" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "ticketTemplateId" TEXT,
    "invoiceSimpleTemplateId" TEXT,
    "invoiceFullTemplateId" TEXT,
    "logo" TEXT,
    "thankYouMessage" TEXT DEFAULT 'Merci de votre visite !',
    "footerText" TEXT,
    "showQrCode" BOOLEAN NOT NULL DEFAULT true,
    "qrCodeType" TEXT NOT NULL DEFAULT 'receipt',
    "qrCodeCustomUrl" TEXT,
    "autoPrintOnOrder" BOOLEAN NOT NULL DEFAULT false,
    "autoEmailOnOrder" BOOLEAN NOT NULL DEFAULT false,
    "defaultReceiptType" "ReceiptType" NOT NULL DEFAULT 'TICKET',
    "receiptPrefix" TEXT NOT NULL DEFAULT 'TK',
    "nextSequenceNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceiptSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReceiptTemplate_restaurantId_idx" ON "ReceiptTemplate"("restaurantId");

-- CreateIndex
CREATE INDEX "ReceiptTemplate_type_idx" ON "ReceiptTemplate"("type");

-- CreateIndex
CREATE INDEX "ReceiptTemplate_isSystem_idx" ON "ReceiptTemplate"("isSystem");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_orderId_key" ON "Receipt"("orderId");

-- CreateIndex
CREATE INDEX "Receipt_restaurantId_idx" ON "Receipt"("restaurantId");

-- CreateIndex
CREATE INDEX "Receipt_orderId_idx" ON "Receipt"("orderId");

-- CreateIndex
CREATE INDEX "Receipt_receiptNumber_idx" ON "Receipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "Receipt_createdAt_idx" ON "Receipt"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_restaurantId_fiscalYear_sequenceNumber_key" ON "Receipt"("restaurantId", "fiscalYear", "sequenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptSettings_restaurantId_key" ON "ReceiptSettings"("restaurantId");

-- AddForeignKey
ALTER TABLE "ReceiptTemplate" ADD CONSTRAINT "ReceiptTemplate_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ReceiptTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptSettings" ADD CONSTRAINT "ReceiptSettings_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
