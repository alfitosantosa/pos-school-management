"use server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const student = await prisma.userData.findMany({
      where: { tahfidzGroup: { id } },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      },
    });
    return NextResponse.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json({ error: "Failed to fetch student" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
