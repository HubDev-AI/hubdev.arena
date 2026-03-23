"use client";

import { useEffect, useState } from "react";

export function FilmGrain() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // H21: Hide entirely when user prefers reduced motion
  if (prefersReducedMotion) return null;

  // H19: Static CSS-based noise instead of continuous rAF canvas animation.
  // Uses a repeating SVG data URI for a lightweight grain texture.
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[2] h-full w-full mix-blend-overlay"
      style={{
        opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "200px 200px",
      }}
      aria-hidden="true"
    />
  );
}
