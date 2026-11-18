"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

interface FadeInOnMountProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  waitForScroll?: boolean;
}

/* Wrapper: remount inner setiap ganti route supaya animasi muncul lagi */
export default function FadeInOnMount(props: FadeInOnMountProps) {
  const pathname = usePathname();
  return <FadeInOnMountInner key={pathname} {...props} />;
}

function FadeInOnMountInner({
  children,
  className,
  delay = 0,
  waitForScroll = false,
}: FadeInOnMountProps) {
  const [visible, setVisible] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;

    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      window.setTimeout(() => setVisible(true), 0);
      return;
    }

    let revealed = false;
    let scrolled = !waitForScroll;

    const reveal = () => {
      if (revealed) return;
      revealed = true;
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.setTimeout(() => setVisible(true), delay);
    };

    const onScroll = () => {
      if (window.scrollY > 8) {
        scrolled = true;
        const rect = node.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          reveal();
        }
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && scrolled) {
          reveal();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(node);
    if (waitForScroll) {
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [delay, waitForScroll]);

  return (
    <div
      ref={wrapperRef}
      className={`hx-rv ${visible ? "in" : ""} ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}
