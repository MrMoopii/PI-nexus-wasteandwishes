import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    // Google({
    //   clientId: process.env.AUTH_GOOGLE_ID,
    //   clientSecret: process.env.AUTH_GOOGLE_SECRET,
    // }),
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
        const [user] = await db
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
          id: user.idUser.toString(),
          name: user.username,
          email: user.email,
          peran: user.peran,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.idUser = user.id;
        token.peran = (user as typeof user & { peran?: string }).peran;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.idUser = token.idUser as string;
        session.user.peran = token.peran as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
});
