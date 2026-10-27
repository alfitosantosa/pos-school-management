import { handlePrismaError } from "@/lib/errorHandlerBackend";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const MONTH_NAMES = ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"];

function normalizeMonth(value: string): number | null {
  const trimmed = value.trim();
  if (/^\d{1,2}$/.test(trimmed)) {
    const month = Number(trimmed);
    return month >= 1 && month <= 12 ? month : null;
  }
  const index = MONTH_NAMES.indexOf(trimmed.toLowerCase());
  return index >= 0 ? index + 1 : null;
}

function getAcademicYear(month: string, year: string): string | null {
  const monthNumber = normalizeMonth(month);
  const yearNumber = Number(year);

  if (!monthNumber || !Number.isFinite(yearNumber)) return null;

  return monthNumber >= 7 ? `${yearNumber}/${yearNumber + 1}` : `${yearNumber - 1}/${yearNumber}`;
}

// Read-only recap per class: item count, paid/unpaid total, and paid amount per month.
export async function GET(request: NextRequest) {
  const classId = request.nextUrl.searchParams.get("classId");
  const academicYear = request.nextUrl.searchParams.get("year");

  if (!classId) {
    return NextResponse.json({ error: "classId is required" }, { status: 400 });
  }

  try {
    const students = await prisma.userData.findMany({
      where: {
        classId,
        role: { name: "Student" },
      },
      select: {
        id: true,
        name: true,
        nisn: true,
        class: { select: { id: true, name: true } },
        paymentItems: { select: { subtotal: true, isPaid: true, month: true, year: true } },
      },
      orderBy: { name: "asc" },
    });

    const data = students.map((student) => {
      let paid = 0;
      let unpaid = 0;
      let paidCount = 0;
      let itemCount = 0;
      const paidMonths: Record<string, number> = {};

      for (const item of student.paymentItems) {
        const itemAcademicYear = getAcademicYear(item.month, item.year);
        if (academicYear && itemAcademicYear !== academicYear) continue;

        const subtotal = Number(item.subtotal);
        itemCount += 1;

        if (item.isPaid) {
          paid += subtotal;
          paidCount += 1;

          const monthNumber = normalizeMonth(item.month);
          if (monthNumber) {
            const key = String(monthNumber);
            paidMonths[key] = (paidMonths[key] ?? 0) + subtotal;
          }
        } else {
          unpaid += subtotal;
        }
      }

      return {
        studentId: student.id,
        name: student.name,
        nisn: student.nisn,
        classId: student.class?.id ?? null,
        className: student.class?.name ?? null,
        itemCount,
        paidCount,
        unpaidCount: itemCount - paidCount,
        total: paid + unpaid,
        paid,
        unpaid,
        paidMonths,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    return handlePrismaError(error);
  }
}
