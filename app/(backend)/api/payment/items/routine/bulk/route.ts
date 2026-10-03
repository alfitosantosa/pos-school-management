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

export async function POST(request: NextRequest) {
  const { studentId, paymentTypeId, quantity, amount, subtotal, name } =
    await request.json();
  try {
    const data = await prisma.paymentItemsRoutine.create({
      data: {
        studentId,
        paymentTypeId,
        quantity,
        amount,
        subtotal,
        name,
      },
    });
    return Response.json({
      message: "Success create payment items routine",
      data: data,
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function PUT(request: NextRequest) {
  const { id, studentId, paymentTypeId, quantity, amount, subtotal, name } =
    await request.json();
  try {
    const data = await prisma.paymentItemsRoutine.update({
      where: {
        id,
      },
      data: {
        studentId,
        paymentTypeId,
        quantity,
        amount,
        subtotal,
        name,
      },
    });
    return Response.json({
      message: `Success update payment items routine id: ${id}`,
      data: data,
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  try {
    const data = await prisma.paymentItemsRoutine.delete({
      where: {
        id,
      },
    });
    return Response.json({
      message: `Deleted payment items routine ${data.name}`,
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}
