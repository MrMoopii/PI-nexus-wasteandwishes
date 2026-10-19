declare module "next-auth" {
  interface User {
    peran: string;
    namaPelanggan?: string | null;
    nomorTelp?: string | null;
    alamat: string | null;
    tanggalLahir: string | null;
  }

  interface Session {
    user: {
      idUser: string;
      username?: string | null;
      email?: string | null;
      image?: string | null;
      peran: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}
