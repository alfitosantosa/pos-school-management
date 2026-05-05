// model Schedule {
//   id             String       @id @default(cuid())
//   classId        String
//   subjectId      String
//   teacherId      String
//   academicYearId String
//   dayOfWeek      Int
//   startTime      String
//   endTime        String
//   room           String?
//   attendances    Attendance[]
//   academicYear   AcademicYear @relation(fields: [academicYearId], references: [id])
//   class          Class        @relation(fields: [classId], references: [id])
//   subject        Subject      @relation(fields: [subjectId], references: [id])
//   teacher        User         @relation("TeacherSchedule", fields: [teacherId], references: [id])

//   @@unique([classId, subjectId, teacherId, dayOfWeek, startTime])
//   @@map("schedules")
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { schedules } = await request.json();

    // Validate input
    if (!schedules || !Array.isArray(schedules)) {
      return NextResponse.json({ error: "Invalid data format. Expected array of schedules." }, { status: 400 });
    }

    // Validate each schedule
    const validatedSchedules = schedules.map((schedule: any) => {
      return {
        classId: schedule.classId,
        subjectId: schedule.subjectId,
        teacherId: schedule.teacherId,
        academicYearId: schedule.academicYearId,
        dayOfWeek: parseInt(schedule.dayOfWeek) || 1,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        room: schedule.room || null,
        isActive: schedule.isActive !== undefined ? schedule.isActive : true,
      };
    });

    const result = await prisma.schedule.createMany({
      data: validatedSchedules,
      skipDuplicates: true, // Skip if duplicate exists based on unique constraint
    });

    return NextResponse.json({
      message: `Successfully created ${result.count} schedules`,
      created: result.count,
      total: schedules.length,
    });
  } catch (error: any) {
    console.error("Error creating schedules:", error);

    // Handle specific Prisma errors
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Duplicate schedule detected. Some schedules may already exist." }, { status: 409 });
    }

    if (error.code === "P2003") {
      return NextResponse.json({ error: "Invalid foreign key. Please check if Class, Subject, Teacher, and Academic Year IDs exist." }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create schedules. Please check your data and try again." }, { status: 500 });
  }
}
