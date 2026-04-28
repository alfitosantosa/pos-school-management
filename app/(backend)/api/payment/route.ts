// model Payment {
//   id                 String              @id @default(cuid())

//   studentId          String
//   paymentTypeId      String
//   majorId            String
//   accountBankId      String
//   amount             Decimal
//   dueDate            DateTime?
//   status             String              @default("pending")
//   notes              String?
//   createdAt          DateTime            @default(now())
//   paymentDate        DateTime
//   receiptNumber      String              @unique
//   paymentTransaction PaymentTransaction?
//   paymentItems       PaymentItems[]
//   student            UserData            @relation("StudentPayment", fields: [studentId], references: [id], onDelete: Cascade)
//   paymentType        PaymentType         @relation(fields: [paymentTypeId], references: [id])
//   major              Major               @relation(fields:[majorId], references:[id])
//   accountBank        AccountBank         @relation(fields:[accountBankId], references:[id])
//   @@map("payments")
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        student: true,
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
    const { studentId, majorId, accountBankId, month, amount, dueDate, status, notes, paymentDate, receiptNumber } = await request.json();

    const newPayment = await prisma.payment.create({
      data: {
        studentId,
        amount: parseFloat(amount),
        accountBankId,
        majorId,
        month,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status,
        notes,
        paymentDate: new Date(paymentDate),
        receiptNumber,
      },
      include: {
        student: true,
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
    const { id, studentId, majorId, month, amount, dueDate, status, notes, paymentDate, receiptNumber } = await request.json();

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        studentId,
        majorId,
        month,
        amount: parseFloat(amount),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status,
        notes,
        paymentDate: new Date(paymentDate),
        receiptNumber,
      },
      include: {
        student: true,
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
