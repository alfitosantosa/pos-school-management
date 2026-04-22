import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const deletedteacherAttendance = await prisma.teacherAttendance.delete({
      where: { id },
    });

    return NextResponse.json(deletedteacherAttendance, { status: 200 });
  } catch (error) {
    console.error("Error deleting teacherAttendance:", error);
    return NextResponse.json({ error: "Failed to delete teacherAttendance" }, { status: 500 });
  }
}
