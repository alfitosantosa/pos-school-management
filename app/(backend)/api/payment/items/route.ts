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

    // Handle both single object dan array of objects
    const itemsToCreate = Array.isArray(body) ? body : [body];

    if (itemsToCreate.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }

    // Validate each item
    for (const item of itemsToCreate) {
      const { name, paymentTypeId, month, year, quantity, amount, subtotal, studentId } = item;
      if (!name || !paymentTypeId || !month || !year || !quantity || !amount || !subtotal || !studentId) {
        return NextResponse.json({ error: "name, paymentTypeId, month, year, quantity, amount, subtotal, and studentId are required" }, { status: 400 });
      }
    }

    const createInvoiceItems = await prisma.paymentItems.createManyAndReturn({
      data: itemsToCreate.map((item: any) => ({
        name: item.name,
        skuType: item.skuType,
        paymentTypeId: item.paymentTypeId,
        month: item.month,
        year: item.year,
        isPaid: item.isPaid ?? false,
        isMonthly: item.isMonthly ?? false,
        isActive: item.isActive ?? true,
        isFixedAmount: item.isFixedAmount,
        isFixedQuantity: item.isFixedQuantity,
        quantity: item.quantity,
        amount: item.amount,
        subtotal: item.subtotal,
        ...(item.paymentId && { paymentId: item.paymentId }),
        studentId: item.studentId,
      })),
    });

    return NextResponse.json(createInvoiceItems);
  } catch (error) {
    console.error("Error creating payment items:", error);
    return NextResponse.json({ error: "Failed to create payment items" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle both single object and array of objects
    const itemsToUpdate =
      Array.isArray(body) ? body
      : body.paymentItems ? body.paymentItems
      : [body];

    if (itemsToUpdate.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }

    // Update each item
    const updatedItems = await Promise.all(
      itemsToUpdate.map(async (item: any) => {
        if (!item.id) {
          throw new Error("id is required for update");
        }

        // Build data object with only defined fields
        const updateData: any = {};

        if (item.name !== undefined) updateData.name = item.name;
        if (item.skuType !== undefined) updateData.skuType = item.skuType;
        if (item.month !== undefined) updateData.month = item.month;
        if (item.year !== undefined) updateData.year = item.year;
        if (item.quantity !== undefined) updateData.quantity = item.quantity;
        if (item.amount !== undefined) updateData.amount = item.amount;
        if (item.subtotal !== undefined) updateData.subtotal = item.subtotal;
        if (item.studentId !== undefined) updateData.studentId = item.studentId;
        if (item.paymentTypeId !== undefined) updateData.paymentTypeId = item.paymentTypeId;
        if (item.paymentId !== undefined) updateData.paymentId = item.paymentId || null;

        // Handle boolean fields
        if (item.isPaid !== undefined) {
          updateData.isPaid = typeof item.isPaid === "boolean" ? item.isPaid : item.isPaid === "true";
        }
        if (item.isMonthly !== undefined) {
          updateData.isMonthly = typeof item.isMonthly === "boolean" ? item.isMonthly : item.isMonthly === "true";
        }
        if (item.isActive !== undefined) {
          updateData.isActive = typeof item.isActive === "boolean" ? item.isActive : item.isActive === "true";
        }
        if (item.isFixedAmount !== undefined) {
          updateData.isFixedAmount = typeof item.isFixedAmount === "boolean" ? item.isFixedAmount : item.isFixedAmount === "true";
        }
        if (item.isFixedQuantity !== undefined) {
          updateData.isFixedQuantity = typeof item.isFixedQuantity === "boolean" ? item.isFixedQuantity : item.isFixedQuantity === "true";
        }

        return await prisma.paymentItems.update({
          where: { id: item.id },
          data: updateData,
          include: {
            PaymentType: true,
            student: true,
            payment: true,
          },
        });
      }),
    );

    return NextResponse.json(updatedItems);
  } catch (error) {
    console.error("Error updating payment item:", error);
    return NextResponse.json({ error: "Failed to update payment item" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array is required for deleting payment items" }, { status: 400 });
    }

    await prisma.paymentItems.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({ message: "Payment items deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment items:", error);
    return NextResponse.json({ error: "Failed to delete payment items" }, { status: 500 });
  }
}
