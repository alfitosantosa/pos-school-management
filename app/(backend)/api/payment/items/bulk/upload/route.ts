import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface PaymentItemInput {
  studentId: string;
  paymentTypeId: string;
  quantity: number;
  amount: number;
  subtotal: number;
  isActive?: boolean;
  isFixedAmount: boolean;
  isFixedQuantity: boolean;
  isMonthly?: boolean;
  isPaid?: boolean;
  month: string;
  name: string;
  year: string;
  skuType: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentItemInput[] = await request.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        { error: "Body harus berupa array dan tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Validate required fields per item
    const errors: string[] = [];
    body.forEach((item, i) => {
      const missing = (["studentId", "paymentTypeId", "month", "year", "name", "skuType"] as const)
        .filter((field) => !item[field]);
      if (missing.length > 0) {
        errors.push(`Index ${i}: missing fields → ${missing.join(", ")}`);
      }
    });

    if (errors.length > 0) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const result = await prisma.paymentItems.createMany({
      data: body.map((item) => ({
        studentId: item.studentId,
        paymentTypeId: item.paymentTypeId,
        quantity: Number(item.quantity),
        amount: Number(item.amount),
        subtotal: Number(item.subtotal),
        isActive: item.isActive ?? true,
        isFixedAmount: item.isFixedAmount,
        isFixedQuantity: item.isFixedQuantity,
        isMonthly: item.isMonthly ?? false,
        isPaid: item.isPaid ?? false,
        month: item.month,
        name: item.name,
        year: item.year,
        skuType: item.skuType,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json(
      {
        message: "Payment items berhasil dibuat",
        count: result.count,
        skipped: body.length - result.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating payment items:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal membuat payment items" },
      { status: 500 }
    );
  }
}