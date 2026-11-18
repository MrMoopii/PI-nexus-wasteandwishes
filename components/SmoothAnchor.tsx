"use client";

import type { MouseEvent, ReactNode } from "react";

interface SmoothAnchorProps {
  href: string;
  className?: string;
  children: ReactNode;
  duration?: number;
}

/* Ease-in-out cubic: mulai lambat, cepat di tengah, melambat di akhir */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function SmoothAnchor({
  href,
  className,
  children,
  duration = 1000,
}: SmoothAnchorProps) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!href.startsWith("#")) return;

    const target = document.getElementById(href.slice(1));
    if (!target) return;

    event.preventDefault();

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduce) {
      target.scrollIntoView();
      return;
    }

    const startY = window.scrollY;
    const distance = target.getBoundingClientRect().top;
    let start: number | null = null;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      window.scrollTo(0, startY + distance * easeInOutCubic(progress));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  return (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
