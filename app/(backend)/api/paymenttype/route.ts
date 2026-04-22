// model PaymentType {
//   id          String    @id @default(cuid())
//   name        String    @unique
//   description String
//   amount      Decimal
//   isMonthly   Boolean   @default(false)
//   isActive    Boolean   @default(true)

//   createdAt   DateTime? @default(now())
//   updatedAt   DateTime? @updatedAt

//   payments    Payment[]

//   @@map("payment_types")
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const paymentTypes = await prisma.paymentType.findMany();
    return NextResponse.json(paymentTypes);
  } catch (error) {
    console.error("Error fetching payment types:", error);
    return NextResponse.json({ error: "Failed to fetch payment types" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, amount, isMonthly, isActive } = await request.json();

    const newPaymentType = await prisma.paymentType.create({
      data: {
        name,
        description,
        amount: parseFloat(amount),
        isMonthly: isMonthly === "true",
        isActive: isActive === "true",
      },
    });

    return NextResponse.json(newPaymentType);
  } catch (error) {
    console.error("Error creating payment type:", error);
    return NextResponse.json({ error: "Failed to create payment type" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, description, amount, isMonthly, isActive } = await request.json();

    const updatedPaymentType = await prisma.paymentType.update({
      where: { id },
      data: {
        name,
        description,
        amount: parseFloat(amount),
        isMonthly: isMonthly === "true",
        isActive: isActive === "true",
      },
    });

    return NextResponse.json(updatedPaymentType);
  } catch (error) {
    console.error("Error updating payment type:", error);
    return NextResponse.json({ error: "Failed to update payment type" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.paymentType.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Payment type deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment type:", error);
    return NextResponse.json({ error: "Failed to delete payment type" }, { status: 500 });
  }
}
