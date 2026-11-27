"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Tampilan jika laporan bulanan gagal dimuat, misalnya query gagal (CONTRIBUTING 9.4).
 * retry() memuat ulang data halaman ini (Next.js 16.3+).
 */
export default function ErrorLaporanBulanan({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-6xl py-16 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">
        Laporan bulanan gagal dimuat
      </h1>
      <p className="mt-3 text-sm text-gray-600">
        Terjadi kesalahan. Silakan coba lagi.
      </p>
      <Button className="mt-6" onClick={() => retry()}>
        Coba lagi
      </Button>
    </div>
  );
}
