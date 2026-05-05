
"use server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const tahfidzGroup = await prisma.tahfidzGroup.findUnique({
      where: { id },
      include: {
      students: {
          orderBy: {
            name: "asc",
          },
        },
        schedules: true,
        _count: { select: { students: true, schedules: true } },
      },
      
    });
    if (!tahfidzGroup) {
      return NextResponse.json({ error: "Tahfidz group not found" }, { status: 404 });
    }
    return NextResponse.json(tahfidzGroup);
  } catch (error) {
    console.error("Error fetching tahfidz group:", error);
    return NextResponse.json({ error: "Failed to fetch tahfidz group" }, { status: 500 });
  }
}