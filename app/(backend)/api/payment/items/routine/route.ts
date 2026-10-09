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

export async function PUT(request: NextRequest) {
  const { id, studentId, paymentTypeId, quantity, amount, subtotal, name } = await request.json();

  if (!id) {
    return Response.json({ message: "id wajib dikirim" }, { status: 400 });
  }

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
  const { id, ids } = await request.json();
  // Accept both a single `id` and an `ids` array. Never fall through to an
  // empty `where`, which would wipe the whole table.
  const idList: string[] = Array.isArray(ids) ? ids : id ? [id] : [];

  if (idList.length === 0) {
    return Response.json({ message: "Tidak ada id yang dikirim" }, { status: 400 });
  }

  try {
    const data = await prisma.paymentItemsRoutine.deleteMany({
      where: {
        id: { in: idList },
      },
    });
    return Response.json({
      message: `Deleted ${data.count} payment items routine`,
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}
