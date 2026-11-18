"use client";

import Image from "next/image";

export default function LoadingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      {/* Logo Waste & Wishes – lingkaran putih 80px */}
      <div className="relative w-20 h-20 rounded-full border-4 border-white flex items-center justify-center overflow-hidden mb-6">
        <Image
          src="/icon/waste-and-wishes-logo.png"
          alt="Waste & Wishes"
          width={80}
          height={80}
          className="object-contain w-full h-full"
          priority
        />
      </div>

      <p className="mt-0 text-center text-sm font-medium text-gray-800">
        Memuat Halaman…
      </p>
    </div>
  );
}
