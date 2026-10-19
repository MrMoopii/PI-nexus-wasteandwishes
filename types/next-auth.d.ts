import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    idUser?: string;
    peran?: string;
  }

  interface Session {
    user: {
      idUser: string;
      peran: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    idUser: string;
    peran: string;
  }
}
