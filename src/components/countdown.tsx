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
  const [parts, setParts] = useState<{ days: number; hours: number; minutes: number } | null>(null);

  useEffect(() => {
    setParts(getCountdownParts(targetIso));
    const timer = window.setInterval(() => {
      setParts(getCountdownParts(targetIso));
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [targetIso]);

  const items = useMemo(
    () => [
      { label: "Days", value: parts ? String(parts.days).padStart(2, "0") : "--" },
      { label: "Hours", value: parts ? String(parts.hours).padStart(2, "0") : "--" },
      { label: "Minutes", value: parts ? String(parts.minutes).padStart(2, "0") : "--" },
    ],
    [parts],
  );

  return (
    <div className="brutal-card overflow-hidden p-0">
      <div className="bg-[var(--ink)] px-5 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">{label}</p>
      </div>
      <div className="grid grid-cols-3 divide-x-[2px] divide-[var(--ink)] p-0">
        {items.map((item) => (
          <div
            key={item.label}
            className="bg-[var(--surface)] p-4 text-center"
          >
            <p className="text-5xl sm:text-6xl font-mono font-black tracking-tight text-[var(--ink)]" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              {item.value}
            </p>
            <p className="brutal-label mt-2">{item.label}</p>
          </div>
        ))}
      </div>
      <div className="h-1.5 w-full bg-gradient-to-r from-[var(--accent-green)] to-[var(--accent-blue)]" />
    </div>
  );
}
