import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const paymentTypes = await prisma.paymentType.findMany({
      where: {
        majorId: id,
      },
      include: {
        major: true,
      },
    });
    return NextResponse.json(paymentTypes);
  } catch (error) {
    console.error("Error fetching payment types:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
