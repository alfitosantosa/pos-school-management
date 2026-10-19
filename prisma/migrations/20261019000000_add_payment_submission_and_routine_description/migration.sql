-- AlterTable
ALTER TABLE "payment_items_routine" ADD COLUMN "description" TEXT;

-- CreateTable
CREATE TABLE "payment_submissions" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "majorId" TEXT NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "totalSubtotal" DECIMAL(65,30) NOT NULL,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_submissions_majorId_idx" ON "payment_submissions"("majorId");

-- CreateIndex
CREATE INDEX "payment_submissions_createdAt_idx" ON "payment_submissions"("createdAt");
