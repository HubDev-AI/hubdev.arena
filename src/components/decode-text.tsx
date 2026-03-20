"use client";

import { useEffect, useRef, useState } from "react";

const DECODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*";

export function DecodeText({
  text,
  className = "",
  speed = 40,
  startDelay = 0,
}: {
  text: string;
  className?: string;
  speed?: number;
  startDelay?: number;
}) {
  const [displayText, setDisplayText] = useState(text.replace(/\S/g, " "));
  const ref = useRef<HTMLSpanElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !hasStarted.current) {
            hasStarted.current = true;
            observer.unobserve(entry.target);

            setTimeout(() => {
              let iteration = 0;
              const maxIterations = text.length * 3;

              const interval = setInterval(() => {
                setDisplayText(
                  text
                    .split("")
                    .map((char, idx) => {
                      if (char === " ") return " ";
                      if (idx < iteration / 3) return text[idx] ?? char;
                      const randIdx = Math.floor(Math.random() * DECODE_CHARS.length);
                      return DECODE_CHARS[randIdx] ?? "X";
                    })
                    .join(""),
                );

                iteration++;
                if (iteration > maxIterations) {
                  clearInterval(interval);
                  setDisplayText(text);
                }
              }, speed);
            }, startDelay);
          }
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [text, speed, startDelay]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {displayText}
    </span>
  );
}
