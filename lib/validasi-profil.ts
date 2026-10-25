interface ProfilLengkapProp {
  username?: string | null;
  namaPelanggan?: string | null;
  nomorTelp?: string | null;
  alamat?: string | null;
  tanggalLahir?: string | null;
}

export function isProfilLengkap(props: ProfilLengkapProp): boolean {
  const { username, namaPelanggan, nomorTelp, alamat, tanggalLahir } = props;
  return Boolean(
    username && namaPelanggan && nomorTelp && alamat && tanggalLahir,
  );
}

export function validasiUsername(username: string): string | null {
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    return "Username 3–30 karakter, hanya huruf, angka, dan garis bawah!";
  }

  return null;
}

export function validasiNamaPelanggan(namaPelanggan: string): string | null {
  if (!/^[\p{L}\s.'-]{2,100}$/u.test(namaPelanggan)) {
    return "Nama hanya boleh berisi huruf, spasi, titik, dan strip!";
  }
  return null;
}

export function validasiNomorTelp(nomorTelp: string): string | null {
  if (!/^\+?\d{9,15}$/.test(nomorTelp)) {
    return "Nomor telepon 9–15 angka, boleh diawali (+)!";
  }

  return null;
}

export function validasiAlamat(alamat: string): string | null {
  if (alamat.length < 5 || alamat.length > 200) {
    return "Alamat harus memiliki 5-200 karakter!";
  }

  return null;
}

export function validasiTanggalLahir(tanggalLahir: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggalLahir)) {
    return "Format tanggal salah!";
  }

  const tgl = new Date(tanggalLahir);

  if (Number.isNaN(tgl.getTime())) {
    return "Tanggal tidak valid!";
  }

  if (tgl.toISOString().slice(0, 10) !== tanggalLahir) {
    return "Tanggal tidak valid!";
  }

  if (tgl > new Date()) {
    return "Tanggal lahir tidak boleh di masa depan!";
  }

  return null;
}
