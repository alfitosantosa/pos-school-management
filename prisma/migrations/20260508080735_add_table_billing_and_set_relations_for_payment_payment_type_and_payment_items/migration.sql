/*
  Warnings:

  - Added the required column `billingId` to the `payment_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `skuType` to the `payment_types` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payment_items" ADD COLUMN     "billingId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "payment_types" ADD COLUMN     "skuType" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "BillingItems" (
    "id" TEXT NOT NULL,
    "paymentTypeId" TEXT NOT NULL,
    "paymentId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "isMonthly" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFixedAmount" BOOLEAN NOT NULL,
    "isFixedQuantity" BOOLEAN NOT NULL,
    "isPaid" BOOLEAN NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "owner" TEXT NOT NULL,
    "skuType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "majorId" TEXT NOT NULL,

    CONSTRAINT "BillingItems_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingItems_name_key" ON "BillingItems"("name");

-- CreateIndex
CREATE INDEX "payment_items_billingId_idx" ON "payment_items"("billingId");

-- CreateIndex
CREATE INDEX "payment_items_studentId_idx" ON "payment_items"("studentId");

-- CreateIndex
CREATE INDEX "payment_items_paymentTypeId_idx" ON "payment_items"("paymentTypeId");

-- CreateIndex
CREATE INDEX "payment_items_paymentId_idx" ON "payment_items"("paymentId");

-- AddForeignKey
ALTER TABLE "BillingItems" ADD CONSTRAINT "BillingItems_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingItems" ADD CONSTRAINT "BillingItems_paymentTypeId_fkey" FOREIGN KEY ("paymentTypeId") REFERENCES "payment_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingItems" ADD CONSTRAINT "BillingItems_majorId_fkey" FOREIGN KEY ("majorId") REFERENCES "majors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_items" ADD CONSTRAINT "payment_items_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "BillingItems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
