"use client";

import { useRef, type ReactNode } from "react";

export function MagneticButton({
  children,
  className = "",
  intensity = 0.3,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  const btnRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * intensity}px, ${y * intensity}px)`;
    btn.style.transition = "transform 0.15s ease";
  };

  const handleMouseLeave = () => {
    const btn = btnRef.current;
    if (!btn) return;
    btn.style.transform = "translate(0, 0)";
    btn.style.transition = "transform 0.4s cubic-bezier(0.2, 0, 0, 1)";
  };

  return (
    <div
      ref={btnRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ display: "inline-block", willChange: "transform" }}
    >
      {children}
    </div>
  );
}
