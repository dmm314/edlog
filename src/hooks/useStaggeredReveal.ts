"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export function useStaggeredReveal(itemCount: number, staggerDelay: number = 80) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      // Show all items immediately
      const all = new Set<number>();
      for (let i = 0; i < itemCount; i++) all.add(i);
      setVisibleItems(all);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger the reveal of child items
            for (let i = 0; i < itemCount; i++) {
              setTimeout(() => {
                setVisibleItems((prev) => new Set(prev).add(i));
              }, i * staggerDelay);
            }
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [itemCount, staggerDelay]);

  const getItemStyle = useCallback(
    (index: number): React.CSSProperties => ({
      opacity: visibleItems.has(index) ? 1 : 0,
      transform: visibleItems.has(index) ? "translateY(0)" : "translateY(8px)",
      transition: `opacity 400ms cubic-bezier(0.16, 1, 0.3, 1), transform 400ms cubic-bezier(0.16, 1, 0.3, 1)`,
    }),
    [visibleItems]
  );

  return { containerRef, getItemStyle, visibleItems };
}
