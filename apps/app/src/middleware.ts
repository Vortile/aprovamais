import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { hasAppEnv } from "@/lib/supabase/env";

type MiddlewareAuth = () => Promise<{ userId: string | null }>;

async function handleAppMiddleware(auth: MiddlewareAuth, request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isSetupRoute = pathname === "/setup";
  const isLoginRoute = pathname === "/login";
  const isSignInRoute = pathname.startsWith("/sign-in");
  const isSignUpRoute = pathname.startsWith("/sign-up");
  const isDashboardRoute = pathname === "/dashboard";
  const isAdminRoute = pathname.startsWith("/admin");
  const isAlunoRoute = pathname.startsWith("/aluno");
  const isProtectedRoute = isAdminRoute || isAlunoRoute || isDashboardRoute;

  if (!hasAppEnv()) {
    if (!isSetupRoute) {
      return NextResponse.redirect(new URL("/setup", request.url));
    }

    return NextResponse.next({ request });
  }

  if (isSetupRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const authState = await auth();

  if (!authState.userId && isProtectedRoute) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (authState.userId && (isLoginRoute || isSignInRoute || isSignUpRoute)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next({ request });
}

export default clerkMiddleware(async (auth, request) => {
  return handleAppMiddleware(auth, request);
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
