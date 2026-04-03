// Auth middleware temporarily disabled for local development/UI work.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/feed/:path*", "/dashboard/:path*"],
};
