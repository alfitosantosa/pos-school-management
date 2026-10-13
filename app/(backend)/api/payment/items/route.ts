import { handlePrismaError } from "@/lib/errorHandlerBackend";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const getAllPaymentItems = await prisma.paymentItems.findMany({
      include: {
        // student: true,
        PaymentType: true,
        payment: true,
        student: {
          include: {
            class: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(getAllPaymentItems);
  } catch (error) {
    return handlePrismaError(error);
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

    console.log("[PaymentItems] Created with quantity:", createPaymentItems.quantity);

    return NextResponse.json(createPaymentItems);
  } catch (error) {
    return handlePrismaError(error);
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
    return handlePrismaError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id, ids } = await request.json();
    // Accept both a single `id` and an `ids` array. Never fall through to an
    // empty `where`, which would wipe the whole table.
    const idList: string[] = Array.isArray(ids) ? ids : id ? [id] : [];

    if (idList.length === 0) {
      return NextResponse.json(
        { message: "Tidak ada id yang dikirim" },
        { status: 400 },
      );
    }

    const result = await prisma.paymentItems.deleteMany({
      where: {
        id: { in: idList },
      },
    });

    return NextResponse.json({
      message: `Deleted ${result.count} payment items`,
      count: result.count,
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}
