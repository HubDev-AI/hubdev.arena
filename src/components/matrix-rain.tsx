"use client";

import { useEffect, useRef, useState } from "react";

const CHARS = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワ";

export function MatrixRain({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // L12: Use devicePixelRatio for crisp rendering on Retina displays
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const rect = canvas.parentElement?.getBoundingClientRect();
    const logicalWidth = rect?.width ?? canvas.width / dpr;
    const logicalHeight = rect?.height ?? canvas.height / dpr;

    const fontSize = 12;
    const columns = Math.floor(logicalWidth / fontSize);
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }

    // H21: If prefers-reduced-motion, render static characters and stop
    if (prefersReducedMotion) {
      ctx.fillStyle = "rgba(10, 10, 10, 1)";
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < columns; i++) {
        const rows = Math.floor(logicalHeight / fontSize);
        for (let r = 0; r < rows; r++) {
          if (Math.random() > 0.85) {
            const charIdx = Math.floor(Math.random() * CHARS.length);
            const char = CHARS[charIdx] ?? "0";
            const brightness = Math.random() * 100 + 155;
            ctx.fillStyle = `rgba(0, ${brightness}, 65, ${Math.random() * 0.15 + 0.03})`;
            ctx.fillText(char, i * fontSize, r * fontSize);
          }
        }
      }
      return () => {
        window.removeEventListener("resize", resize);
      };
    }

    const draw = () => {
      ctx.fillStyle = "rgba(10, 10, 10, 0.08)";
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        if (d === undefined) continue;

        const charIdx = Math.floor(Math.random() * CHARS.length);
        const char = CHARS[charIdx] ?? "0";

        // Random green shade
        const brightness = Math.random() * 100 + 155;
        ctx.fillStyle = `rgba(0, ${brightness}, 65, ${Math.random() * 0.3 + 0.05})`;
        ctx.fillText(char, i * fontSize, d * fontSize);

        if (d * fontSize > logicalHeight && Math.random() > 0.98) {
          drops[i] = 0;
        }

        drops[i] = d + 0.3 + Math.random() * 0.3;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 opacity-30 ${className}`}
      style={{ width: "100%", height: "100%" }}
      aria-hidden="true"
    />
  );
}
