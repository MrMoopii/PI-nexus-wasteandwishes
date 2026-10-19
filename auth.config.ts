import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuth = nextUrl.pathname.startsWith("/auth/login") ||
                       nextUrl.pathname.startsWith("/auth/register");
      const isOnProtected = nextUrl.pathname.startsWith("/langganan") ||
                            nextUrl.pathname.startsWith("/event") ||
                            nextUrl.pathname.startsWith("/profil") ||
                            nextUrl.pathname.startsWith("/admin");

      if (isOnProtected) {
        if (isLoggedIn) return true;
        return false;
      }

      if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;