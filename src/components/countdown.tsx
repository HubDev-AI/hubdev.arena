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
      { label: "Days", value: String(parts.days).padStart(2, "0") },
      { label: "Hours", value: String(parts.hours).padStart(2, "0") },
      { label: "Minutes", value: String(parts.minutes).padStart(2, "0") },
    ],
    [parts],
  );

  return (
    <div className="brutal-card p-5">
      <p className="brutal-label">{label}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="border-[2px] border-[var(--ink)] bg-[var(--bg)] p-3 text-center"
          >
            <p className="text-3xl font-black tracking-tight text-[var(--ink)]">
              {item.value}
            </p>
            <p className="brutal-label mt-1">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
