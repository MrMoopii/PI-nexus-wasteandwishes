"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

// 1. Komponen internal yang membaca pathname
function HideOnAdminContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) return null;

  return <>{children}</>;
}

// 2. Komponen utama yang dibungkus dengan Suspense
export default function HideOnAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <HideOnAdminContent>{children}</HideOnAdminContent>
    </Suspense>
  );
}