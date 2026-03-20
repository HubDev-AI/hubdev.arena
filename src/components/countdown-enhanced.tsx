"use client";

import { useEffect, useState } from "react";

function getTimeParts(targetIso: string) {
  const distance = Math.max(0, new Date(targetIso).getTime() - Date.now());
  return {
    days: Math.floor(distance / (24 * 60 * 60 * 1_000)),
    hours: Math.floor((distance % (24 * 60 * 60 * 1_000)) / (60 * 60 * 1_000)),
    minutes: Math.floor((distance % (60 * 60 * 1_000)) / (60 * 1_000)),
    seconds: Math.floor((distance % (60 * 1_000)) / 1_000),
    isExpired: distance <= 0,
  };
}

function CountdownDigit({ value, label }: { value: string; label: string }) {
  const [prevValue, setPrevValue] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      setIsFlipping(true);
      const timer = setTimeout(() => {
        setPrevValue(value);
        setIsFlipping(false);
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [value, prevValue]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative overflow-hidden">
        <div
          className={`flex h-14 w-14 items-center justify-center bg-[var(--ink)] sm:h-16 sm:w-16 ${isFlipping ? "animate-[number-glow_0.6s_ease]" : ""}`}
          style={{
            boxShadow: "0 0 15px rgba(0, 255, 65, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <span
            className={`font-mono text-2xl font-black tracking-tight text-[var(--accent-green)] sm:text-3xl transition-transform duration-300 ${isFlipping ? "scale-110" : "scale-100"}`}
            style={{
              textShadow: "0 0 10px rgba(0, 255, 65, 0.4)",
            }}
          >
            {value}
          </span>
          {/* Scanline effect */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.1) 2px, rgba(0,255,65,0.1) 4px)",
            }}
          />
        </div>
      </div>
      <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-gray-500">{label}</span>
    </div>
  );
}

function Separator() {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 px-0.5">
      <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent-green)] animate-pulse" />
      <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent-green)] animate-pulse" style={{ animationDelay: "0.5s" }} />
    </div>
  );
}

export function CountdownEnhanced({
  targetIso,
  label,
}: {
  targetIso: string;
  label: string;
}) {
  const [time, setTime] = useState(() => getTimeParts(targetIso));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeParts(targetIso));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetIso]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="brutal-card overflow-hidden p-0 rotating-border">
      {/* HUD corner accents (as real elements since rotating-border uses pseudo-elements) */}
      <div className="pointer-events-none absolute top-0 left-0 z-[3] h-4 w-4 border-t-2 border-l-2 border-[var(--accent-green)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 z-[3] h-4 w-4 border-b-2 border-r-2 border-[var(--accent-green)]" />
      <div className="bg-black/40 px-5 py-3 flow-border-bottom">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)] neon-text">
          {label}
        </p>
      </div>
      <div className="bg-gradient-to-b from-gray-950 to-[var(--ink)] px-4 py-5">
        {time.isExpired ? (
          <div className="flex items-center justify-center py-4">
            <span className="font-mono text-lg font-bold uppercase tracking-widest text-[var(--accent-green)] neon-text animate-pulse">
              Time&apos;s up
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-0.5">
            <CountdownDigit value={pad(time.days)} label="Days" />
            <Separator />
            <CountdownDigit value={pad(time.hours)} label="Hours" />
            <Separator />
            <CountdownDigit value={pad(time.minutes)} label="Min" />
            <Separator />
            <CountdownDigit value={pad(time.seconds)} label="Sec" />
          </div>
        )}
      </div>
      <div className="h-[2px] w-full bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-blue)] to-[var(--accent-green)]" style={{ backgroundSize: "200% 100%", animation: "border-flow 3s ease infinite" }} />
    </div>
  );
}
