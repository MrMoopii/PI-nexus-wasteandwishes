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
      lastActivityAt?: number;
      isIdle?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    idUser: string;
    peran: string;
    lastActivityAt?: number;
  }
}
