import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;

  if (!user || !pass) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice(6));
    const [reqUser, ...rest] = decoded.split(":");
    const reqPass = rest.join(":");
    if (reqUser === user && reqPass === pass) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Protected"',
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/webpack-hmr|__nextjs_original-stack-frames|api/health|favicon.ico).*)",
  ],
};
