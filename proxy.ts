import { NextResponse, type NextRequest } from "next/server";
import { isAuthConfigured, verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  // Not configured yet — let requests through so pages can render their own
  // "not configured" message instead of redirect-looping to a login that
  // can't actually check anything.
  if (!isAuthConfigured()) return NextResponse.next();

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname.startsWith("/login");
  const isPublicAsset = pathname.startsWith("/tool.html");
  if (isPublicAsset) return NextResponse.next();

  const authed = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!authed && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (authed && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|tool.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
