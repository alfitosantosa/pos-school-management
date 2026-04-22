import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { classId, paymentTypeId, amount, dueDate, status, notes, paymentDate } = await request.json();

    if (!classId || !paymentTypeId || !amount || !paymentDate) {
      return NextResponse.json({ error: "classId, paymentTypeId, amount, and paymentDate are required" }, { status: 400 });
    }

    const parsedPaymentDate = new Date(paymentDate);
    if (isNaN(parsedPaymentDate.getTime())) {
      return NextResponse.json({ error: "Invalid paymentDate" }, { status: 400 });
    }

    let students;

    if (classId === "all") {
      students = await prisma.userData.findMany({
        where: {
          role: {
            name: "Student",
          },
        },
      });
    } else {
      students = await prisma.userData.findMany({
        where: {
          classId: classId,
          role: {
            name: "Student",
          },
        },
      });
    }

    const newPaymentBulk = await prisma.payment.createMany({
      data: students.map((student) => ({
        paymentTypeId,
        studentId: student.id,
        amount: parseFloat(amount),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || "Unpaid",
        notes: notes ? notes : null,
        paymentDate: parsedPaymentDate,
        receiptNumber: `KWT-${randomUUID()}`,
      })),
    });

    return NextResponse.json(newPaymentBulk);
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
