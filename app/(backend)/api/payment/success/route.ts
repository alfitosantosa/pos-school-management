import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { id, status, receiptNumber } = await request.json();

    const newPayment = await prisma.payment.update({
      where: {
        id,
      },
      data: {
        status,
        receiptNumber,
      },
    });

    return NextResponse.json(newPayment);
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
