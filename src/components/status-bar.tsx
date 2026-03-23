"use client";

import { useEffect, useRef, useState } from "react";

const BAR_COUNT = 20;

export function StatusBar({
  className = "",
  frequencyData,
  prefersReducedMotion = false,
}: {
  className?: string;
  frequencyData?: Uint8Array | null;
  prefersReducedMotion?: boolean;
}) {
  const [bars, setBars] = useState<number[]>(
    () => Array.from({ length: BAR_COUNT }, () => Math.random() * 40 + 10),
  );
  const prevRef = useRef(bars);

  // When frequency data from music analyser is available, use it
  useEffect(() => {
    if (!frequencyData || frequencyData.length === 0) return;

    const step = Math.max(1, Math.floor(frequencyData.length / BAR_COUNT));
    const newBars: number[] = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      const idx = Math.min(i * step, frequencyData.length - 1);
      const val = frequencyData[idx] ?? 0;
      // Normalize 0-255 to 5-100, with smoothing from previous
      const prev = prevRef.current[i] ?? 20;
      const target = Math.max(5, (val / 255) * 100);
      newBars.push(prev + (target - prev) * 0.4); // Smooth lerp
    }
    prevRef.current = newBars;
    setBars(newBars);
  }, [frequencyData]);

  // Compelling idle animation when music is OFF — entices user to click play
  useEffect(() => {
    // If real frequency data is flowing, skip idle animation
    if (frequencyData && frequencyData.some((v) => v > 0)) return;

    // H21: If prefers-reduced-motion, show static bars
    if (prefersReducedMotion) {
      setBars(Array.from({ length: BAR_COUNT }, (_, i) => 20 + (i % 3) * 15));
      return;
    }

    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      setBars((prev) =>
        prev.map((_, i) => {
          // Create a wave pattern that moves across the bars
          const wave = Math.sin((frame * 0.15) + (i * 0.4)) * 30 + 40;
          const pulse = Math.sin(frame * 0.08) * 15;
          const jitter = (Math.random() - 0.5) * 10;
          return Math.max(8, Math.min(90, wave + pulse + jitter));
        }),
      );
    }, 80); // Fast updates for smooth wave

    return () => clearInterval(interval);
  }, [frequencyData, prefersReducedMotion]);

  return (
    <div className={`flex items-end gap-[2px] h-6 ${className}`} aria-hidden="true">
      {bars.map((height, i) => (
        <div
          key={i}
          className="w-[3px] rounded-t-sm"
          style={{
            height: `${height}%`,
            background: height > 70
              ? "var(--accent-green)"
              : height > 40
                ? "var(--accent-cyan)"
                : "var(--accent-blue)",
            opacity: Math.max(0.4, height / 100),
            boxShadow: height > 60 ? `0 0 4px rgba(0, 255, 65, ${height / 300})` : "none",
            transition: frequencyData ? "height 0.08s ease, opacity 0.08s ease" : "all 1s ease",
          }}
        />
      ))}
    </div>
  );
}
