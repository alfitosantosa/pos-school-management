// model Payment {
//   id            String      @id @default(cuid())
//   studentId     String
//   paymentTypeId String
//   amount        Decimal
//   dueDate       DateTime?
//   status        String      @default("pending")
//   notes         String?
//   createdAt     DateTime    @default(now())
//   updatedAt     DateTime    @updatedAt
//   paymentDate   DateTime
//   receiptNumber String?
//   paymentType   PaymentType @relation(fields: [paymentTypeId], references: [id])
//   student       UserData    @relation("StudentPayment", fields: [studentId], references: [id], onDelete: Cascade)

//   @@map("payments")
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        student: true,
        paymentType: true,
        paymentTransaction: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { studentId, paymentTypeId, amount, dueDate, status, notes, paymentDate, receiptNumber } = await request.json();

    const newPayment = await prisma.payment.create({
      data: {
        studentId,
        paymentTypeId,
        amount: parseFloat(amount),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status,
        notes,
        paymentDate: new Date(paymentDate),
        receiptNumber,
      },
      include: {
        student: true,
        paymentType: true,
      },
    });

    return NextResponse.json(newPayment);
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, studentId, paymentTypeId, amount, dueDate, status, notes, paymentDate, receiptNumber } = await request.json();

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        studentId,
        paymentTypeId,
        amount: parseFloat(amount),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status,
        notes,
        paymentDate: new Date(paymentDate),
        receiptNumber,
      },
      include: {
        student: true,
        paymentType: true,
      },
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const deletedClass = await prisma.payment.delete({
      where: { id },
    });

    return NextResponse.json(deletedClass, { status: 200 });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}
