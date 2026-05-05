"use server";
// app/api/clerk-users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authClient } from "@/lib/auth-client";

export async function POST(request: NextRequest) {
  const { userId, role } = await request.json();
  try {
    await authClient.admin.setRole({
      userId: userId, // id dari database
      role: role,
    });
    return NextResponse.json({ message: "Role assigned successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error assigning role:", error);
    return NextResponse.json({ error: "Failed to assign role" }, { status: 500 });
  }
}
