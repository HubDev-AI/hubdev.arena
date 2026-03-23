"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";

export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(0, 255, 65, 0.06)",
}: {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const disabledRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    const update = () => {
      disabledRef.current = mq.matches || isTouchDevice || window.innerWidth < 768;
    };
    update();

    const handler = () => update();
    mq.addEventListener("change", handler);
    window.addEventListener("resize", handler);

    return () => {
      mq.removeEventListener("change", handler);
      window.removeEventListener("resize", handler);
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabledRef.current) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--spotlight-x", `${x}px`);
    card.style.setProperty("--spotlight-y", `${y}px`);
  }, []);

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      style={{
        background: `radial-gradient(300px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), ${spotlightColor}, transparent 60%), var(--surface)`,
      }}
    >
      {children}
    </div>
  );
}
