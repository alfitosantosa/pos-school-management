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
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const paymentItems = await prisma.paymentItemsRoutine.findMany({
      include: {
        PaymentType: true,
        student: true,
      },
    });
    return Response.json(paymentItems);
  } catch {
    return Response.json({ message: "error" });
  }
}

export async function POST(request: NextRequest) {
  const { PaymentItemsRoutines } = await request.json();
  try {
    const data = await prisma.paymentItemsRoutine.createMany({
      data: PaymentItemsRoutines,
    });
    return Response.json({
      message: "Success create payment items bulk routine",
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const { ids } = await request.json();
  try {
    const data = await prisma.paymentItemsRoutine.deleteMany({
      where: {
        id: ids,
      },
    });
    return Response.json({
      message: `Deleted bulk payment items routine`,
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}
