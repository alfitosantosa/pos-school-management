import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const getAllPaymentItems = await prisma.paymentItems.findMany({
      include: {
        student: true,
        PaymentType: true,
        payment: true,
      },
    });

    return NextResponse.json(getAllPaymentItems);
  } catch (error) {
    console.error("Error fetching payment items:", error);

    return NextResponse.json({ error: "Failed to fetch payment items" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { studentId, paymentTypeId, quantity, amount, subtotal, month, name, year, skuType } = body;

    const createPaymentItems = await prisma.paymentItems.create({
      data: {
        studentId,
        paymentTypeId,
        quantity: Number(quantity),
        amount: Number(amount),
        subtotal: Number(subtotal),
        month,
        name,
        year,
        skuType,
      },
    });

    return NextResponse.json(createPaymentItems);
  } catch (error) {
    console.error("Error creating payment item:", error);

    return NextResponse.json({ error: "Failed to create payment item" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const { id, studentId, paymentTypeId, quantity, amount, subtotal, month, name, year, skuType } = body;

    const updatedPaymentItems = await prisma.paymentItems.update({
      where: {
        id,
      },
      data: {
        studentId,
        paymentTypeId,
        quantity: Number(quantity),
        amount: Number(amount),
        subtotal: Number(subtotal),
        month,
        name,
        year,
        skuType,
      },
    });

    return NextResponse.json(updatedPaymentItems);
  } catch (error) {
    console.error("Error processing payment:", error);

    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    const deletedPaymentItems = await prisma.paymentItems.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(deletedPaymentItems);
  } catch (error) {
    console.error("Error deleting payment items:", error);

    return NextResponse.json({ error: "Failed to delete payment items" }, { status: 500 });
  }
}
