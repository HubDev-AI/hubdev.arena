"use client";

import { useEffect, useMemo, useState } from "react";

function getCountdownParts(targetIso: string) {
  const distance = Math.max(0, new Date(targetIso).getTime() - Date.now());
  const days = Math.floor(distance / (24 * 60 * 60 * 1_000));
  const hours = Math.floor((distance % (24 * 60 * 60 * 1_000)) / (60 * 60 * 1_000));
  const minutes = Math.floor((distance % (60 * 60 * 1_000)) / (60 * 1_000));

  return { days, hours, minutes };
}

export function Countdown({ targetIso, label }: { targetIso: string; label: string }) {
  const [parts, setParts] = useState(() => getCountdownParts(targetIso));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setParts(getCountdownParts(targetIso));
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [targetIso]);

  const items = useMemo(
    () => [
      { label: "DAYS", value: String(parts.days).padStart(2, "0") },
      { label: "HRS", value: String(parts.hours).padStart(2, "0") },
      { label: "MIN", value: String(parts.minutes).padStart(2, "0") },
    ],
    [parts],
  );

  return (
    <div
      style={{
        border: "var(--border-thick)",
        boxShadow: "var(--shadow)",
        background: "var(--white)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono, 'Space Mono', monospace)",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.28em",
          color: "var(--muted)",
          padding: "0.5rem 1rem 0",
        }}
      >
        {label}
      </div>
      <div style={{ display: "inline-flex", gap: 0, width: "100%" }}>
        {items.map((item, i) => (
          <div
            key={item.label}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "0.75rem 0.5rem",
              borderRight: i < items.length - 1 ? "var(--border-thick)" : "none",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-heading, 'Syne', sans-serif)",
                fontWeight: 900,
                fontSize: "2.25rem",
                lineHeight: 1,
                color: "var(--black)",
                letterSpacing: "-0.04em",
              }}
            >
              {item.value}
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono, 'Space Mono', monospace)",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "var(--muted)",
                marginTop: "0.25rem",
              }}
            >
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
