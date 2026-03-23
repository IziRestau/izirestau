-- AlterTable
ALTER TABLE "ClientPayment" ADD COLUMN     "invoiceId" TEXT;

-- CreateIndex
CREATE INDEX "ClientPayment_invoiceId_idx" ON "ClientPayment"("invoiceId");

-- AddForeignKey
ALTER TABLE "ClientPayment" ADD CONSTRAINT "ClientPayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "ClientInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
