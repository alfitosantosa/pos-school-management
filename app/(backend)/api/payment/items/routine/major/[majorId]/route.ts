// model PaymentItemsRoutine {
//   id            String      @id @default(uuid())
//   studentId     String
//   paymentTypeId String
//   quantity      Decimal
//   amount        Decimal
//   subtotal      Decimal
//   name          String
//   createdAt     DateTime    @default(now())
//   updatedAt     DateTime    @updatedAt
//   PaymentType   PaymentType @relation(fields: [paymentTypeId], references: [id])
//   student       UserData    @relation(fields: [studentId], references: [id])

import { handlePrismaError } from "@/lib/errorHandlerBackend";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ majorId: string }> },
) {
  const { majorId } = await params;

  if (!majorId) {
    return NextResponse.json(
      { error: "Dibutuhkan Id Sekolah" },
      { status: 400 },
    );
  }
  try {
    const paymentItems = await prisma.paymentItemsRoutine.findMany({
      where: {
        student: {
          majorId,
        },
      },
      include: {
        PaymentType: true,
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
    return Response.json(paymentItems);
  } catch (error) {
    return handlePrismaError(error);
  }
}
