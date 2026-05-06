// model PaymentItems {
//   id            String      @id @default(uuid())

//   paymentId     String
//   studentId     String
//   studentName   String
//   paymentTypeId String
//   skuName       String
//   quantity      Int
//   amount        Int
//   subtotal      Int

//   payment       Payment     @relation(fields: [paymentId], references: [id])
//   PaymentType   PaymentType @relation(fields: [paymentTypeId], references: [id])
//   student       UserData    @relation(fields: [studentId], references: [id])

//   @@map("payment_items")
// }

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Check if body is array (direct payment items) or object with paymentItems property
    let paymentItems: any[];
    let paymentId: string | undefined;
    let studentId: string | undefined;
    let studentName: string | undefined;

    if (Array.isArray(body)) {
      // Direct array format
      paymentItems = body;
      // Get paymentId and studentId from first item
      if (paymentItems.length > 0) {
        paymentId = paymentItems[0].paymentId;
        studentId = paymentItems[0].studentId;
        studentName = paymentItems[0].studentName;
      }
    } else {
      // Object format with paymentItems property
      paymentItems = body.paymentItems || [];
      paymentId = body.paymentId;
      studentId = body.studentId;
      studentName = body.studentName;
    }

    if (!paymentItems || paymentItems.length === 0) {
      return NextResponse.json({ error: "paymentItems array is required and cannot be empty" }, { status: 400 });
    }

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    // If studentId not provided, get it from the payment
    if (!studentId && paymentId) {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { student: true },
      });

      if (payment) {
        studentId = payment.studentId;
        studentName = payment.student?.name || "";
      }
    }

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required and could not be found" }, { status: 400 });
    }

    const CreateInvoiceItems = await prisma.paymentItems.createMany({
      data: paymentItems.map((item: any) => ({
        paymentId: item.paymentId || paymentId,
        studentId: item.studentId || studentId,
        studentName: item.studentName || studentName || "",
        paymentTypeId: item.paymentTypeId,
        skuName: item.name || item.skuName,
        quantity: item.quantity,
        amount: item.amount,
        subtotal: item.subtotal,
      })),
    });

    return NextResponse.json(CreateInvoiceItems);
  } catch (error) {
    console.error("Error creating payment items:", error);
    return NextResponse.json({ error: "Failed to create payment items" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { paymentItems } = await request.json();

    if (!paymentItems || !Array.isArray(paymentItems) || paymentItems.length === 0) {
      return NextResponse.json({ error: "paymentItems array is required and cannot be empty" }, { status: 400 });
    }

    // Update each payment item individually
    const updatePromises = paymentItems.map((item: any) =>
      prisma.paymentItems.update({
        where: { id: item.id },
        data: {
          paymentTypeId: item.paymentTypeId,
          skuName: item.name || item.skuName,
          quantity: item.quantity,
          amount: item.amount,
          subtotal: item.subtotal,
          studentId: item.studentId,
          studentName: item.studentName,
        },
      }),
    );

    const updatedItems = await Promise.all(updatePromises);

    return NextResponse.json(updatedItems);
  } catch (error) {
    console.error("Error updating payment items:", error);
    return NextResponse.json({ error: "Failed to update payment items" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array is required and cannot be empty" }, { status: 400 });
    }

    const DeleteInvoiceItems = await prisma.paymentItems.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json(DeleteInvoiceItems);
  } catch (error) {
    console.error("Error deleting payment items:", error);
    return NextResponse.json({ error: "Failed to delete payment items" }, { status: 500 });
  }
}
