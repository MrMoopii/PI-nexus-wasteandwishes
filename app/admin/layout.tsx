import { cookies } from "next/headers";
import { Suspense } from "react";
import AdminLayoutClient from "./AdminLayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AdminThemeFallback />}>
      <AdminLayoutWithTheme>{children}</AdminLayoutWithTheme>
    </Suspense>
  );
}

async function AdminLayoutWithTheme({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const initialDarkMode = cookieStore.get("admin-theme")?.value === "dark";
  return <AdminLayoutClient initialDarkMode={initialDarkMode}>{children}</AdminLayoutClient>;
}

function AdminThemeFallback() {
  return (
    <div className="admin-shell admin-theme-dark flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-pulse rounded-full border-2 border-blue-300/30 border-t-blue-300" />
    </div>
  );
}
