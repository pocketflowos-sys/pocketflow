import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/dashboard/:path*", "/transactions/:path*", "/budgets/:path*", "/lend-borrow/:path*", "/investments/:path*", "/assets/:path*", "/settings/:path*", "/checkout/:path*"]
};
