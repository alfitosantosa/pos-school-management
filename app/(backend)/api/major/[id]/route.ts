import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const major = await prisma.major.findUnique({
      where: { id },
    });

    if (!major) {
      return NextResponse.json({ success: false, message: "Major not found" }, { status: 404 });
    }

    return NextResponse.json(major);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch major";
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
