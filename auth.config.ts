import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = auth?.user?.peran === "admin";
      const isOnAuth =
        nextUrl.pathname.startsWith("/auth/login") ||
        nextUrl.pathname.startsWith("/auth/register");
      const isOnProtected =
        nextUrl.pathname.startsWith("/langganan") ||
        nextUrl.pathname.startsWith("/event") ||
        nextUrl.pathname.startsWith("/profil");
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");

      // Akses halaman /langganan, /event, /profil harus login terlebih dahulu
      if (isOnProtected) {
        if (isLoggedIn) return true;
        return false;
      }

      // Akses halaman /admin harus login sebagai admin
      if (isOnAdmin) {
        if (!isLoggedIn) return false;
        if (!isAdmin) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      // Jika sudah berhasil login/register di arahkan ke halaman root
      if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.idUser = token.idUser as string;
        session.user.peran = token.peran as string;
      }
      return session;
    },
  },

  providers: [],
} satisfies NextAuthConfig;
