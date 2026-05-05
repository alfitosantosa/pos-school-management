import { NextResponse } from "next/server";

export async function GET() {
  const data = {
    connection: "success",
  };
  return NextResponse.json(data);
}
