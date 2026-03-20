"use client";

import { useMemo, useSyncExternalStore } from "react";

function getCountdownParts(targetIso: string) {
  const distance = Math.max(0, new Date(targetIso).getTime() - Date.now());
  const days = Math.floor(distance / (24 * 60 * 60 * 1_000));
  const hours = Math.floor((distance % (24 * 60 * 60 * 1_000)) / (60 * 60 * 1_000));
  const minutes = Math.floor((distance % (60 * 60 * 1_000)) / (60 * 1_000));

  return { days, hours, minutes };
}

function useCountdown(targetIso: string) {
  const subscribe = useMemo(() => {
    return (onStoreChange: () => void) => {
      const timer = setInterval(onStoreChange, 60_000);
      return () => clearInterval(timer);
    };
  }, []);

  const snapshot = useSyncExternalStore(
    subscribe,
    () => {
      const p = getCountdownParts(targetIso);
      return `${p.days}:${p.hours}:${p.minutes}`;
    },
    () => "--:--:--",
  );

  const [days, hours, minutes] = snapshot.split(":").map((v) => (v === "--" ? null : Number(v)));
  return { days, hours, minutes };
}

export function Countdown({ targetIso, label }: { targetIso: string; label: string }) {
  const { days, hours, minutes } = useCountdown(targetIso);

  const items = [
    { label: "Days", value: days != null ? String(days).padStart(2, "0") : "--" },
    { label: "Hours", value: hours != null ? String(hours).padStart(2, "0") : "--" },
    { label: "Minutes", value: minutes != null ? String(minutes).padStart(2, "0") : "--" },
  ];

  return (
    <div className="brutal-card overflow-hidden p-0">
      <div className="bg-[var(--ink)] px-5 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">{label}</p>
      </div>
      <div className="grid grid-cols-3 divide-x-[2px] divide-[var(--ink)] p-0">
        {items.map((item) => (
          <div
            key={item.label}
            className="bg-[var(--surface)] px-3 py-3 text-center"
          >
            <p className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-[var(--ink)]" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              {item.value}
            </p>
            <p className="brutal-label mt-1">{item.label}</p>
          </div>
        ))}
      </div>
      <div className="h-1.5 w-full bg-gradient-to-r from-[var(--accent-green)] to-[var(--accent-blue)]" />
    </div>
  );
}
