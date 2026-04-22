// model TahfidzRecord {
//   id         String      @id @default(cuid())
//   startVerse Int?
//   endVerse   Int?
//   grade      String?
//   date       DateTime
//   notes      String?
//   createdAt  DateTime    @default(now())
//   updatedAt  DateTime    @updatedAt
//   studentId  String?
//   teacherId  String?
//   surahQuranId String?
//   student    UserData?   @relation("TahfidzStudent", fields: [studentId], references: [id], onDelete: Cascade)
//   surah      SurahQuran? @relation(fields: [surahQuranId], references: [id])
//   teacher    UserData?   @relation("TahfidzTeacher", fields: [teacherId], references: [id], onDelete: Cascade)

//   @@map("tahfidz_records")
// }

"use server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tahfidzRecords = await prisma.tahfidzRecord.findMany({
      include: {
        student: true,
        teacher: true,
        surah: true,
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(tahfidzRecords);
  } catch (error) {
    console.error("Error fetching tahfidz records:", error);
    return NextResponse.json({ error: "Failed to fetch tahfidz records" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { studentId, teacherId, surahQuranId, startVerse, endVerse, grade, date, notes } = await request.json();
    const newRecord = await prisma.tahfidzRecord.create({
      data: {
        studentId,
        teacherId,
        surahQuranId,
        startVerse,
        endVerse,
        grade,
        date: new Date(date),
        notes,
      },
    });
    return NextResponse.json(newRecord);
  } catch (error) {
    console.error("Error creating tahfidz record:", error);
    return NextResponse.json({ error: "Failed to create tahfidz record" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const updatedRecord = await prisma.tahfidzRecord.update({
      where: { id: data.id },
      data: {
        studentId: data.studentId,
        teacherId: data.teacherId,
        surahQuranId: data.surah,
        startVerse: data.startVerse,
        endVerse: data.endVerse,
        grade: data.grade,
        date: new Date(data.date),
        notes: data.notes,
      },
    });
    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error("Error updating tahfidz record:", error);
    return NextResponse.json({ error: "Failed to update tahfidz record" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const data = await request.json();
    const deletedRecord = await prisma.tahfidzRecord.delete({
      where: { id: data.id },
    });
    return NextResponse.json(deletedRecord);
  } catch (error) {
    console.error("Error deleting tahfidz record:", error);
    return NextResponse.json({ error: "Failed to delete tahfidz record" }, { status: 500 });
  }
}
