export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/feed/:path*",
    "/dashboard/:path*",
    "/search/:path*",
    "/news/:path*",
    "/groups/:path*",
    "/settings/:path*",
  ],
};
