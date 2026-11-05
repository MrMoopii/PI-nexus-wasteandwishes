"use client";

import { useEffect, useRef, useState } from "react";

/* ─── Komponen Statistik Animasi Angka ─── */
interface AnimatedCounterProps {
  value: number;
  suffix: string;
  duration?: number;
  className?: string;
}

export default function AnimatedCounter({
  value,
  suffix,
  duration = 1400,
  className = "text-(--hx-accent) text-3xl sm:text-4xl font-semibold",
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);
  const elementRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const node = elementRef.current;
    if (!node || hasAnimated.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start: number | null = null;
          const startValue = 0;

          const animate = (timestamp: number) => {
            if (start === null) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const nextValue = Math.round(
              startValue + (value - startValue) * eased,
            );
            setCount(nextValue);

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [duration, value]);

  return (
    <h3
      ref={elementRef}
      className={`font-(family-name:--font-plus-jakarta-sans) tracking-tight ${className}`}
    >
      {count}
      {suffix}
    </h3>
  );
}
