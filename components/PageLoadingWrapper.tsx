"use client";

import { useState, useEffect } from "react";
import LoadingPage from "./LoadingPage";

export default function PageLoadingWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <LoadingPage />;
  }

  return <>{children}</>;
}