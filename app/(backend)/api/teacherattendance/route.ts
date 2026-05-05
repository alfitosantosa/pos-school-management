import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const teacherId = searchParams.get("teacherId");

    const whereClause: any = {};

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (teacherId) {
      whereClause.teacherId = teacherId;
    }

    const attendances = await prisma.teacherAttendance.findMany({
      where: whereClause,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            avatarUrl: true,
            position: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error("Error fetching teacher attendance:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teacherId, date, status, notes, createdBy, checkinTime } = body;

    // Validate required fields
    if (!teacherId || !date || !createdBy) {
      return NextResponse.json({ error: "Missing required fields: teacherId, date, createdBy" }, { status: 400 });
    }

    // Check if attendance already exists for this teacher on this date (once per day constraint)
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const existingAttendance = await prisma.teacherAttendance.findUnique({
      where: {
        teacherId_date: {
          teacherId,
          date: attendanceDate,
        },
      },
    });

    if (existingAttendance) {
      return NextResponse.json({ error: "Attendance already recorded for this teacher today" }, { status: 409 });
    }

    const attendance = await prisma.teacherAttendance.create({
      data: {
        teacherId,
        date: attendanceDate,
        status: status || "hadir",
        notes,
        createdBy,
        checkinTime: checkinTime ? new Date(checkinTime) : new Date(),
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            avatarUrl: true,
            position: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error("Error creating teacher attendance:", error);
    return NextResponse.json({ error: "Failed to create attendance" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, notes, checkoutTime } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing attendance ID" }, { status: 400 });
    }

    const attendance = await prisma.teacherAttendance.update({
      where: { id },
      data: {
        status: status || undefined,
        notes,
        checkoutTime: checkoutTime ? new Date(checkoutTime) : undefined,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            avatarUrl: true,
            position: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error updating teacher attendance:", error);
    return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // Baca dari query parameter, bukan dari body
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    const attendance = await prisma.teacherAttendance.delete({
      where: { id },
    });
    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error deleting attendance:", error);
    return NextResponse.json({ error: "Failed to delete attendance" }, { status: 500 });
  }
}
