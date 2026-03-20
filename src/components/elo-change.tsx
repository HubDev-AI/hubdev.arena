"use client";

import { useEffect, useState } from "react";

export function EloChange({
  change,
  className = "",
}: {
  change: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible || change === 0) return null;

  const isPositive = change > 0;

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-mono text-xs font-bold ${isPositive ? "text-[var(--accent-green)]" : "text-red-400"} ${className}`}
      style={{
        animation: "elo-float 2s ease-out forwards",
      }}
    >
      {isPositive ? "+" : ""}{change}
      <style>{`
        @keyframes elo-float {
          0% { opacity: 1; transform: translateY(0); }
          70% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-20px); }
        }
      `}</style>
    </span>
  );
}
