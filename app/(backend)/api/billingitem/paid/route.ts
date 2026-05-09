import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();
    // @ts-expect-error - billingItem model not yet defined in schema
    const updateAllItems = await prisma.billingItem.updateMany({
      where: { paymentId: ids },
      data: { isPaid: true },
    });
    return NextResponse.json(updateAllItems);
  } catch (error) {
    console.error("Error updating billing items:", error);
    return NextResponse.json({ error: "Failed to update billing items" }, { status: 500 });
  }
}
