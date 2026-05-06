import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function GET(_: NextRequest, { params }: { params: Promise<{ majorId: string }> }) {
  const { majorId } = await params;

  if (!majorId) {
    return NextResponse.json({ error: "Student ID required" }, { status: 400 });
  }

  try {
    const accountBank = await prisma.accountBank.findMany({
      where: {
        majorId: majorId,
      },
      include: { majors: true },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(accountBank);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
