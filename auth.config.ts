import type { NextAuthConfig } from "next-auth";
import { hitungIdle } from "@/lib/session";

export const authConfig = {
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { nextUrl } = request;

      if (request.headers.has("next-action")) {
        return true;
      }

      const isLoggedIn = !!auth?.user;
      const isAdmin = auth?.user?.peran === "admin";
      const isIdle = hitungIdle(auth?.user?.lastActivityAt);
      const isOnAuth =
        nextUrl.pathname.startsWith("/auth/login") ||
        nextUrl.pathname.startsWith("/auth/register");
      const isOnProtected =
        nextUrl.pathname.startsWith("/langganan") ||
        nextUrl.pathname.startsWith("/buat-jadwal-janjian") ||
        nextUrl.pathname.startsWith("/event") ||
        nextUrl.pathname.startsWith("/profil");
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");

      // Akses halaman langganan, jadwal janjian, event, dan profil perlu login
      if (isOnProtected) {
        if (isLoggedIn && !isIdle) return true;
        if (isLoggedIn && isIdle) {
          return Response.redirect(new URL("/auth/login?reason=idle", nextUrl));
        }
        return false;
      }

      // Akses halaman /admin harus login sebagai admin
      if (isOnAdmin) {
        if (!isLoggedIn) return false;
        if (isIdle)
          return Response.redirect(new URL("/auth/login?reason=idle", nextUrl));
        if (!isAdmin) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      // Jika sudah berhasil login/register di arahkan ke halaman root
      if (isOnAuth && isLoggedIn && !isIdle) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
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
        session.user.isIdle = hitungIdle(token.lastActivityAt);
        if (typeof token.lastActivityAt === "number") {
          session.user.lastActivityAt = token.lastActivityAt;
        }
      }
      return session;
    },
  },

  providers: [],
} satisfies NextAuthConfig;
