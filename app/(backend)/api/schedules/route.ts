// model Schedule {
//   id             String       @id @default(cuid())
//   classId        String?
//   tahfidzGroupId String?
//   subjectId      String
//   teacherId      String
//   academicYearId String
//   dayOfWeek      Int
//   startTime      String
//   endTime        String
//   room           String?
//   isActive       Boolean      @default(true)
//   assignments    Assignment[]
//   attendances    Attendance[]
//   grades         Grade[]
//   academicYear   AcademicYear @relation(fields: [academicYearId], references: [id])
//   class          Class?       @relation(fields: [classId], references: [id])
//   tahfidzGroup   TahfidzGroup?  @relation("TahfidzGroupSchedule", fields: [tahfidzGroupId], references: [id])
//   subject        Subject      @relation(fields: [subjectId], references: [id])
//   teacher        UserData     @relation("TeacherSchedule", fields: [teacherId], references: [id])

//   @@unique([classId, subjectId, teacherId, dayOfWeek, startTime])
//   @@map("schedules")
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const schedules = await prisma.schedule.findMany({
      include: { class: true, subject: true, teacher: true, academicYear: true, tahfidzGroup: true },
      orderBy: { startTime: "asc" },
    });
    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { classId, subjectId, teacherId, academicYearId, dayOfWeek, startTime, endTime, room, tahfidzGroupId } = await request.json();
    const schedule = await prisma.schedule.create({
      data: {
        classId,
        tahfidzGroupId,
        subjectId,
        teacherId,
        academicYearId,
        dayOfWeek,
        startTime,
        endTime,
        room,
      },
    });
    return NextResponse.json(schedule);
  } catch (error) {
    return NextResponse.json({ error: "Jadwal dengan kombinasi kelas, mata pelajaran, guru, hari, dan jam yang sam a sudah ada." }, { status: 409 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, classId, subjectId, teacherId, academicYearId, dayOfWeek, startTime, endTime, room, tahfidzGroupId } = await request.json();
    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        classId,
        tahfidzGroupId,
        subjectId,
        teacherId,
        academicYearId,
        dayOfWeek,
        startTime,
        endTime,
        room,
      },
    });
    return NextResponse.json(schedule);
  } catch (error) {
    return NextResponse.json({ error: "Jadwal dengan kombinasi kelas, mata pelajaran, guru, hari, dan jam yang sama sudah ada." }, { status: 409 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    await prisma.schedule.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 });
  }
}
