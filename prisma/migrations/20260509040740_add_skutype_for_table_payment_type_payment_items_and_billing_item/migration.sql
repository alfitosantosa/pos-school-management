/*
  Warnings:

  - You are about to drop the column `skuName` on the `payment_items` table. All the data in the column will be lost.
  - Added the required column `Name` to the `payment_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `skuType` to the `payment_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BillingItems" ALTER COLUMN "isFixedAmount" SET DEFAULT false,
ALTER COLUMN "isFixedQuantity" SET DEFAULT false,
ALTER COLUMN "isPaid" SET DEFAULT false;

-- AlterTable
ALTER TABLE "payment_items" DROP COLUMN "skuName",
ADD COLUMN     "Name" TEXT NOT NULL,
ADD COLUMN     "skuType" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "payments_majorId_idx" ON "payments"("majorId");
