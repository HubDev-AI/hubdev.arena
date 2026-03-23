"use client";

import { useEffect, useState } from "react";

export function LiveBadge({ className = "" }: { className?: string }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    // M34: Increase text-[9px] to text-[11px] minimum
    <span className={`inline-flex items-center gap-1.5 rounded-sm border border-[var(--accent-green)]/30 bg-[var(--accent-green)]/10 px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--accent-green)] ${className}`}>
      <span className="relative flex h-1.5 w-1.5">
        {/* H21: Static dot when prefers-reduced-motion, no pulse animation */}
        {prefersReducedMotion ? null : (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent-green)] opacity-75" />
        )}
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent-green)]" style={{ boxShadow: "0 0 6px rgba(0, 255, 65, 0.6)" }} />
      </span>
      Live
    </span>
  );
}
