import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function GET(_: NextRequest, { params }: { params: Promise<{ idTeacher: string }> }) {
  const { idTeacher } = await params;

  if (!idTeacher) {
    return NextResponse.json({ error: "Student ID required" }, { status: 400 });
  }

  try {
    const tahfidzRecordByIdTeacher = await prisma.tahfidzRecord.findMany({
      where: {
        teacherId: idTeacher,
      },
      include: {
        student: true,
        teacher: true,
        surah: true,
      },
      orderBy: {
        date: "desc",
      },
    });
    return NextResponse.json(tahfidzRecordByIdTeacher);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  } finally {
    await prisma.$disconnect;
  }
}
