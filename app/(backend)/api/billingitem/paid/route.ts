import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();
    const updateAllItems = await prisma.billingItems.updateMany({
      where: { paymentId: ids },
      data: { isPaid: true },
    });
    return NextResponse.json(updateAllItems);
  } catch (error) {
    console.error("Error updating billing items:", error);
    return NextResponse.json({ error: "Failed to update billing items" }, { status: 500 });
  }
}
