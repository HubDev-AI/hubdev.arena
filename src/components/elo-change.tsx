"use client";

import { useEffect, useState } from "react";

// M44: Moved @keyframes from inline <style> tag to React style prop
const eloFloatAnimation = "elo-float 2s ease-out forwards";

export function EloChange({
  change,
  className = "",
}: {
  change: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // M44: Drive the animation via React state instead of injecting <style> tags
  useEffect(() => {
    const start = performance.now();
    const duration = 2000;
    let animId: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      setProgress(t);
      if (t < 1) {
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  if (!visible || change === 0) return null;

  const isPositive = change > 0;

  // Replicate the elo-float keyframes: 0%→opacity:1,translateY(0) | 70%→opacity:1 | 100%→opacity:0,translateY(-20px)
  const opacity = progress < 0.7 ? 1 : 1 - ((progress - 0.7) / 0.3);
  const translateY = -20 * progress;

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-mono text-xs font-bold ${isPositive ? "text-[var(--accent-green)]" : "text-red-400"} ${className}`}
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {isPositive ? "+" : ""}{change}
    </span>
  );
}
