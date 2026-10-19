import { handlePrismaError } from "@/lib/errorHandlerBackend";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const majorId = searchParams.get("majorId");

    if (!majorId) {
      return NextResponse.json(
        { error: "majorId wajib diisi" },
        { status: 400 },
      );
    }

    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "50") || 50,
      200,
    );

    const data = await prisma.paymentSubmission.findMany({
      where: { majorId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(data);
  } catch (error) {
    return handlePrismaError(error);
  }
}
