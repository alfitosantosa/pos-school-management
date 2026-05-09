// model BillingItems {
//   id              String         @id @default(cuid())
//
//   paymentTypeId   String
//   paymentId       String?
//   name            String         @unique
//   description     String
//   amount          Decimal
//   isMonthly       Boolean        @default(false)
//   isActive        Boolean        @default(true)
//   isFixedAmount   Boolean        @default(false)
//   isFixedQuantity Boolean        @default(false)
//   isPaid          Boolean        @default(false)
//   quantity        Decimal
//   subtotal        Decimal
//   owner           String
//   skuType         String
//   status          String
//   majorId         String
//
//   paymentItems    PaymentItems[]
//   payment         Payment?      @relation(fields: [paymentId], references: [id])
//   PaymentType     PaymentType @relation(fields: [paymentTypeId], references: [id])
//   major           Major     @relation(fields: [majorId], references: [id])
// }

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const getAllItems = await prisma.billingItems.findMany();
    return NextResponse.json(getAllItems);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { BillingItemsData } = await request.json();

    const BulkPostBillingItem = await prisma.billingItems.createMany({
      data: BillingItemsData,
    });
    return NextResponse.json(BulkPostBillingItem);
  } catch (error) {
    console.error("Error creating billing items:", error);
    return NextResponse.json({ error: "Failed to create billing items" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, updateData } = await request.json();

    const updateBillingItem = await prisma.billingItems.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(updateBillingItem);
  } catch (error) {
    console.error("Error updating billing item:", error);
    return NextResponse.json({ error: "Failed to update billing item" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();
    const deleteAllItems = await prisma.billingItems.deleteMany({
      where: { paymentId: ids },
    });
    return NextResponse.json(deleteAllItems);
  } catch (error) {
    console.error("Error deleting billing items:", error);
    return NextResponse.json({ error: "Failed to delete billing items" }, { status: 500 });
  }
}
