// model Payment {
//   id                 String              @id @default(cuid())
//   studentId          String
//   amount             Decimal
//   dueDate            DateTime?
//   status             String              @default("pending")
//   notes              String?
//   createdAt          DateTime            @default(now())
//   paymentDate        DateTime
//   receiptNumber      String              @unique
//   accountBankId      String
//   bankRef            String?
//   majorId            String
//   month              String
//   bendaharaId        String
//   paymentItems       PaymentItems[]
//   paymentTransaction PaymentTransaction?
//   accountBank        AccountBank         @relation(fields: [accountBankId], references: [id])
//   createdBy          UserData            @relation("CreatedPayment", fields: [bendaharaId], references: [id])
//   major              Major               @relation(fields: [majorId], references: [id])
//   student            UserData            @relation("StudentPayment", fields: [studentId], references: [id], onDelete: Cascade)

//   @@map("payments")
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // ✅ Optimized: Use select to fetch only needed fields
    // - Dropped: student.class (never accessed), createdBy (only bendaharaId used)
    // - Kept: all fields accessed in UI (student.name, major.name, accountBank, paymentItems with paymentType)
    const payments = await prisma.payment.findMany({
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        dueDate: true,
        receiptNumber: true,
        month: true,
        bankRef: true,
        notes: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            parentPhone: true,
          },
        },
        major: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        accountBank: {
          select: {
            id: true,
            accountNumber: true,
            accountName: true,
            accountBank: true,
          },
        },
        paymentItems: {
          select: {
            id: true,
            paymentId: true,
            paymentTypeId: true,
            amount: true,
            quantity: true,
            skuType: true,
            PaymentType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
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
    const { studentId, amount, dueDate, status, notes, paymentDate, receiptNumber, accountBankId, majorId, month, bendaharaId, bankRef } = await request.json();

    const newPayment = await prisma.payment.create({
      data: {
        studentId,
        bendaharaId,
        amount: parseFloat(amount),
        accountBankId,
        bankRef,
        majorId,
        month,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status,
        notes,
        paymentDate: new Date(paymentDate),
        receiptNumber,
      },
      include: {
        createdBy: true,
        student: true,
        major: true,
        accountBank: true,
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
    const { id, studentId, amount, dueDate, status, notes, paymentDate, receiptNumber, accountBankId, majorId, month, bankRef } = await request.json();

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        studentId,
        majorId,
        accountBankId,
        month,
        amount: parseFloat(amount),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status,
        notes,
        paymentDate: new Date(paymentDate),
        receiptNumber,
        bankRef,
      },
      include: {
        student: true,
        major: true,
        accountBank: true,
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

    // First, delete payment transaction if exists
    await prisma.paymentTransaction.deleteMany({
      where: { paymentId: id },
    });

    // Then, delete all payment items associated with this payment
    await prisma.paymentItems.deleteMany({
      where: { paymentId: id },
    });

    // Finally, delete the payment
    const deletedPayment = await prisma.payment.delete({
      where: { id },
    });

    return NextResponse.json(deletedPayment, { status: 200 });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}
