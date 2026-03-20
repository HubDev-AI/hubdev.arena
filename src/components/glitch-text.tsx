"use client";

import { useEffect, useState } from "react";

export function GlitchText({
  text,
  className = "",
  glitchOnHover = true,
}: {
  text: string;
  className?: string;
  glitchOnHover?: boolean;
}) {
  const [displayText, setDisplayText] = useState(text);
  const [isGlitching, setIsGlitching] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    setDisplayText(text);
    // Run one initial glitch on mount for dramatic effect
    if (!hasInitialized) {
      setHasInitialized(true);
      const timer = setTimeout(() => triggerGlitch(), 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerGlitch = () => {
    if (isGlitching) return;
    setIsGlitching(true);

    const chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?01";
    const original = text;
    let iterations = 0;

    const interval = setInterval(() => {
      setDisplayText(
        original
          .split("")
          .map((char, idx) => {
            if (idx < iterations) return original[idx];
            if (char === " ") return " ";
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join(""),
      );

      iterations += 1;

      if (iterations > original.length) {
        clearInterval(interval);
        setDisplayText(original);
        setIsGlitching(false);
      }
    }, 30);
  };

  return (
    <span
      className={className}
      onMouseEnter={glitchOnHover ? triggerGlitch : undefined}
      style={{ display: "inline-block" }}
    >
      {displayText}
    </span>
  );
}
