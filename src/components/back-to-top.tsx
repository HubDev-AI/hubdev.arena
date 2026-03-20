"use client";

import { useEffect, useState } from "react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center border border-[var(--accent-green)]/30 bg-[var(--surface)] font-mono text-xs font-bold text-[var(--accent-green)] transition-all duration-300 hover:bg-[var(--accent-green)] hover:text-black ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"}`}
      style={{
        boxShadow: visible ? "0 0 15px rgba(0, 255, 65, 0.15)" : "none",
      }}
      aria-label="Back to top"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M7 12V2M2 6l5-4 5 4" />
      </svg>
    </button>
  );
}
