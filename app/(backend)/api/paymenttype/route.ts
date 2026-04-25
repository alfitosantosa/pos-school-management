// model PaymentType {
//   id              String         @id @default(cuid())
//   name            String         @unique
//   owner           String
//   description     String
//   amount          Decimal
//   quantity        Decimal
//   subtotal        Decimal
//   isMonthly       Boolean        @default(false)
//   isActive        Boolean        @default(true)
//   isFixedAmount   Boolean
//   isFixedQuantity Boolean

//   paymentItems    PaymentItems[]
//   payments        Payment[]

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
    const { name, owner, description, amount, quantity, subtotal, isMonthly, isActive, isFixedAmount, isFixedQuantity } = await request.json();

    const newPaymentType = await prisma.paymentType.create({
      data: {
        name,
        description,
        amount: parseFloat(amount),
        quantity: parseFloat(quantity),
        subtotal: parseFloat(subtotal),
        isMonthly: typeof isMonthly === "boolean" ? isMonthly : isMonthly === "true",
        isActive: typeof isActive === "boolean" ? isActive : isActive === "true",
        isFixedAmount: typeof isFixedAmount === "boolean" ? isFixedAmount : isFixedAmount === "true",
        isFixedQuantity: typeof isFixedQuantity === "boolean" ? isFixedQuantity : isFixedQuantity === "true",
        owner,
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
    const { id, name, owner, description, amount, quantity, subtotal, isMonthly, isActive, isFixedAmount, isFixedQuantity } = await request.json();

    const updatedPaymentType = await prisma.paymentType.update({
      where: { id },
      data: {
        name,
        description,
        owner,
        amount: parseFloat(amount),
        quantity: parseFloat(quantity),
        subtotal: parseFloat(subtotal),
        isMonthly: typeof isMonthly === "boolean" ? isMonthly : isMonthly === "true",
        isActive: typeof isActive === "boolean" ? isActive : isActive === "true",
        isFixedAmount: typeof isFixedAmount === "boolean" ? isFixedAmount : isFixedAmount === "true",
        isFixedQuantity: typeof isFixedQuantity === "boolean" ? isFixedQuantity : isFixedQuantity === "true",
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
      where: { id: id },
    });

    return NextResponse.json({ message: "Payment type deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment type:", error);
    return NextResponse.json({ error: "Failed to delete payment type" }, { status: 500 });
  }
}
