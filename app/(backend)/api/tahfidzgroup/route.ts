// model TahfidzGroup {
//   id                  String               @id @default(cuid())
//   name                String
//   grade               Int
//   capacity            Int                  @default(40)
//   isActive            Boolean              @default(true)
//   schedules           Schedule[]           @relation("TahfidzGroupSchedule")
//   students            UserData[]           @relation("UserTahfidzGroup")

//   @@unique([name])
//   @@index([grade])
//   @@map("tahfidz_groups")
// }

"use server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const tahfidzGroups = await prisma.tahfidzGroup.findMany({
          include: {
            _count: { select:{
              students: true,
            }},
          },
            orderBy: { grade: "asc" },
        });
        return NextResponse.json(tahfidzGroups);
    } catch (error) {
        console.error("Error fetching tahfidz groups:", error);
        return NextResponse.json({ error: "Failed to fetch tahfidz groups" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { name, grade, capacity } = await request.json();
        if (!name || !grade) {
            return NextResponse.json({ error: "Name, grade, and capacity are required" }, { status: 400 });
        }

        const newTahfidzGroup = await prisma.tahfidzGroup.create({
            data: {
                name,
                grade,
                capacity: capacity || 40,
            },
        });

        return NextResponse.json(newTahfidzGroup, { status: 201 });
    } catch (error) {
        console.error("Error creating tahfidz group:", error);
        return NextResponse.json({ error: "Failed to create tahfidz group" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { id, name, grade, capacity } = await request.json();
        if (!id || !name || !grade) {
            return NextResponse.json({ error: "ID, name, grade, and capacity are required" }, { status: 400 });
        }

        const updatedTahfidzGroup = await prisma.tahfidzGroup.update({
            where: { id },
            data: {
                name,
                grade,
                capacity: capacity || 40,
            },
        });

        return NextResponse.json(updatedTahfidzGroup);
    } catch (error) {
        console.error("Error updating tahfidz group:", error);
        return NextResponse.json({ error: "Failed to update tahfidz group" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { id } = await request.json();
        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const deletedTahfidzGroup = await prisma.tahfidzGroup.delete({
            where: { id },
        });

        return NextResponse.json(deletedTahfidzGroup);
    } catch (error) {
        console.error("Error deleting tahfidz group:", error);
        return NextResponse.json({ error: "Failed to delete tahfidz group" }, { status: 500 });
    }
}
