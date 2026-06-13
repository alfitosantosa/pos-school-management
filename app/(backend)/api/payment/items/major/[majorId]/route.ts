import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function GET(_: NextRequest, { params }: { params: Promise<{ majorId: string }> }) {
  const { majorId } = await params;

  if (!majorId) {
    return NextResponse.json({ error: "Student ID required" }, { status: 400 });
  }

  try {
    const payments = await prisma.paymentItems.findMany({
      where: {
        student: {
          majorId: majorId,
        },
      },
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
    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
