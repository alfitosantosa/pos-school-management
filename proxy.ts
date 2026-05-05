import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  // console.log("Middleware - Session cookie:", sessionCookie);

  if (!sessionCookie) {
    // console.log("No session cookie found, redirecting to sign-in");
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/dashboard"], // Specify the routes the middleware applies to
};
