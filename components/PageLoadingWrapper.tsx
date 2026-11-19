"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import LoadingPage from "./LoadingPage";

/* Wrapper: remount inner setiap ganti route supaya splash muncul lagi
   setiap kali pengguna kembali ke halaman ini dari halaman lain. */
export default function PageLoadingWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <PageLoadingWrapperInner key={pathname}>{children}</PageLoadingWrapperInner>
  );
}

function PageLoadingWrapperInner({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  // LoadingPage akan memberitahu kapan aset (logo + font) selesai dimuat.
  // Jeda 100ms agar tidak berkedip terlalu cepat.
  const handleReady = () => {
    setTimeout(() => setShowSplash(false), 100);
  };

  return (
    <>
      {showSplash ? <LoadingPage onReady={handleReady} /> : children}
    </>
  );
}
