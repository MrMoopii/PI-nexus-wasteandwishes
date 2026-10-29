import type { NextAuthConfig } from "next-auth";
import { SESSION_IDLE_TIMEOUT_MS } from "@/lib/session";

export const authConfig = {
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    jwt({ token, user, trigger }) {
      if (user) {
        token.idUser = user.id;
        token.peran = user.peran;
        token.lastActivityAt = Date.now();
      } else if (trigger === "update") {
        token.lastActivityAt = Date.now();
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.idUser = token.idUser as string;
        session.user.peran = token.peran as string;
      }
      if (session.user && typeof token.lastActivityAt === "number") {
        session.user.lastActivityAt = token.lastActivityAt;
        session.user.isIdle =
          Date.now() - token.lastActivityAt >= SESSION_IDLE_TIMEOUT_MS;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const lastActivityAt = auth?.user?.lastActivityAt;
      const isIdle =
        typeof lastActivityAt !== "number" ||
        Date.now() - lastActivityAt >= SESSION_IDLE_TIMEOUT_MS;
      const isOnAuth = nextUrl.pathname.startsWith("/auth/login") ||
                       nextUrl.pathname.startsWith("/auth/register");
      const isOnProtected = nextUrl.pathname.startsWith("/langganan") ||
                            nextUrl.pathname.startsWith("/event") ||
                            nextUrl.pathname.startsWith("/profil") ||
                            nextUrl.pathname.startsWith("/admin");

      if (isOnProtected) {
        if (isLoggedIn && !isIdle) return true;
        if (isLoggedIn && isIdle) {
          return Response.redirect(new URL("/auth/login?reason=idle", nextUrl));
        }
        return false;
      }

      if (isOnAuth && isLoggedIn && !isIdle) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
