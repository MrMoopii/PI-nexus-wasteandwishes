import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    subscriptionActive: boolean;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      subscriptionActive: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    subscriptionActive: boolean;
  }
}