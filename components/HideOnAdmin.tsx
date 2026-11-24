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
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>
      <HideOnAdminContent>{children}</HideOnAdminContent>
    </Suspense>
  );
}
