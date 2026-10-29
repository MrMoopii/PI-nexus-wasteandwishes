import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  session: {
    strategy: "jwt",
    // The JWT must remain readable so middleware can enforce the shorter idle timeout.
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID, // Kode Auth Google ID
      clientSecret: process.env.AUTH_GOOGLE_SECRET, // Kode Google Secret
      authorization: { params: { prompt: "select_account" } }, // Selalu tampilkan daftar akun ketika mau login dengan Google
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;
        const [user] = await getDb()
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return null;
        }

        return {
          // nama variabel return mengikuti format Auth.js
          id: user.idUser.toString(),
          name: user.username,
          email: user.email,
          peran: user.peran,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ user, token, account, trigger }) {
      if (account?.provider === "google" && token.email) {
        const [row] = await getDb()
          .select()
          .from(users)
          .where(eq(users.email, token.email.toLowerCase()))
          .limit(1);

        if (row) {
          token.idUser = row.idUser.toString();
          token.peran = row.peran;
        }
      } else if (user) {
        token.idUser = user.id;
        token.peran = user.peran;
      }
      if (user || trigger === "update") {
        token.lastActivityAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.idUser = token.idUser as string;
        session.user.peran = token.peran as string;
        session.user.lastActivityAt = token.lastActivityAt as number;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") {
        return true;
      }

      if (!user.email || profile?.email_verified !== true) {
        return false;
      }

      const email = user.email.trim().toLowerCase();
      const [row] = await getDb()
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (row?.password) {
        return "/auth/login?error=EmailSudahTerdaftar";
      }

      if (row?.peran === "admin") {
        return "/admin";
      }

      if (!row) {
        await getDb().insert(users).values({
          email: email,
        });
      }

      return true;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
});
