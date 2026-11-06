"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ambilKeranjang } from "./keranjang/actions";

const sumberGambarKeranjang =
  "/img/keranjang/istockphoto-1325904846-612x612-removebg-preview.png";

export default function TombolKeranjang() {
  const pathname = usePathname();
  const [jumlahJenisProduk, setJumlahJenisProduk] = useState(0);

  useEffect(() => {
    let masihTerpasang = true;

    async function muatJumlahBarang(): Promise<void> {
      try {
        const hasil = await ambilKeranjang();
        if (!masihTerpasang) return;

        if (!hasil.ok) {
          setJumlahJenisProduk(0);
          return;
        }

        setJumlahJenisProduk(hasil.items.length);
      } catch (error) {
        console.error("Jumlah keranjang tidak dapat dimuat.", error);
        if (masihTerpasang) setJumlahJenisProduk(0);
      }
    }

    void muatJumlahBarang();

    return () => {
      masihTerpasang = false;
    };
  }, [pathname]);

  return (
    <Link
      href="/store/keranjang"
      aria-label={`Keranjang belanja, ${jumlahJenisProduk} jenis produk`}
      className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-(--hx-pastel) bg-white/80 shadow-[0_8px_30px_rgb(27,34,51,0.06)] transition-colors hover:border-(--hx-accent) hover:bg-white"
    >
      <Image
        src={sumberGambarKeranjang}
        alt=""
        width={38}
        height={38}
        className="h-9 w-9 object-contain"
      />
      <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-(--hx-accent) px-1 text-[10px] font-bold leading-none text-white">
        {jumlahJenisProduk > 99 ? "99+" : jumlahJenisProduk}
      </span>
    </Link>
  );
}
