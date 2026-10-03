-- CreateTable
CREATE TABLE "payment_items_routine" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "paymentTypeId" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_items_routine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_items_routine_studentId_idx" ON "payment_items_routine"("studentId");

-- CreateIndex
CREATE INDEX "payment_items_routine_paymentTypeId_idx" ON "payment_items_routine"("paymentTypeId");

-- AddForeignKey
ALTER TABLE "payment_items_routine" ADD CONSTRAINT "payment_items_routine_paymentTypeId_fkey" FOREIGN KEY ("paymentTypeId") REFERENCES "payment_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_items_routine" ADD CONSTRAINT "payment_items_routine_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "user_data"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
