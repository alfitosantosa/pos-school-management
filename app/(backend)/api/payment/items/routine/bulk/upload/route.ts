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

interface PaymentItemsRoutineInput {
  studentId: string;
  paymentTypeId: string;
  quantity: number;
  amount: number;
  subtotal: number;
  name: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentItemsRoutineInput[] = await request.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ error: "Body harus berupa array dan tidak boleh kosong" }, { status: 400 });
    }

    const requiredFields = ["studentId", "paymentTypeId", "name"] as const;

    const validationErrors: Array<{ index: number; message: string }> = [];

    body.forEach((item, index) => {
      const missing = requiredFields.filter((field) => !item[field]);
      if (missing.length > 0) {
        validationErrors.push({ index, message: `Missing fields: ${missing.join(", ")}` });
      }

      if (isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
        validationErrors.push({ index, message: "quantity harus berupa angka positif" });
      }

      if (isNaN(Number(item.amount)) || Number(item.amount) < 0) {
        validationErrors.push({ index, message: "amount harus berupa angka non-negatif" });
      }

      if (isNaN(Number(item.subtotal)) || Number(item.subtotal) < 0) {
        validationErrors.push({ index, message: "subtotal harus berupa angka non-negatif" });
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json({ error: "Validation errors", details: validationErrors }, { status: 400 });
    }

    const studentIds = [...new Set(body.map((item) => item.studentId))];
    const paymentTypeIds = [...new Set(body.map((item) => item.paymentTypeId))];

    const [existingStudents, existingPaymentTypes] = await Promise.all([
      prisma.userData.findMany({ where: { id: { in: studentIds } }, select: { id: true } }),
      prisma.paymentType.findMany({ where: { id: { in: paymentTypeIds } }, select: { id: true } }),
    ]);

    const existingStudentIds = new Set(existingStudents.map((s) => s.id));
    const missingStudents = studentIds.filter((id) => !existingStudentIds.has(id));
    if (missingStudents.length > 0) {
      return NextResponse.json({ error: `Student tidak ditemukan: ${missingStudents.join(", ")}` }, { status: 400 });
    }

    const existingPaymentTypeIds = new Set(existingPaymentTypes.map((pt) => pt.id));
    const missingPaymentTypes = paymentTypeIds.filter((id) => !existingPaymentTypeIds.has(id));
    if (missingPaymentTypes.length > 0) {
      return NextResponse.json({ error: `PaymentType tidak ditemukan: ${missingPaymentTypes.join(", ")}` }, { status: 400 });
    }

    const result = await prisma.paymentItemsRoutine.createMany({
      data: body.map((item) => ({
        studentId: item.studentId,
        paymentTypeId: item.paymentTypeId,
        quantity: Number(item.quantity),
        amount: Number(item.amount),
        subtotal: Number(item.subtotal),
        name: item.name,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json(
      {
        message: "Payment items routine berhasil dibuat",
        count: result.count,
        skipped: body.length - result.count,
        total: body.length,
      },
      { status: 201 },
    );
  } catch (error) {
    return handlePrismaError(error);
  }
}
