"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { BuilderSession } from "@/lib/server/auth";
import { LogoutButton } from "@/components/logout-button";

export function MobileMenu({
  session,
  dataMode,
  navLinks,
}: {
  session: BuilderSession | null;
  dataMode?: string;
  navLinks: { href: string; label: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        className={`flex h-10 w-10 items-center justify-center border-[3px] border-[var(--ink)] font-mono text-sm font-bold transition-all ${
          isOpen
            ? "bg-[var(--accent-green)] text-[var(--text-primary)] shadow-[0_0_15px_rgba(0,255,65,0.3)]"
            : "bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--accent-green)] hover:shadow-[0_0_10px_rgba(0,255,65,0.2)]"
        }`}
      >
        {isOpen ? "X" : (
          <span className="flex flex-col gap-[3px]">
            <span className="block h-[2px] w-4 bg-current" />
            <span className="block h-[2px] w-4 bg-current" />
            <span className="block h-[2px] w-4 bg-current" />
          </span>
        )}
      </button>

      {isOpen ? (
        <div className="animate-slide-up absolute left-0 right-0 top-full z-50 border-b border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <nav className="stagger-children mx-auto flex max-w-6xl flex-col px-4 py-2 sm:px-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="border-b-[2px] border-[var(--line)]/50 px-3 py-4 font-mono text-sm font-bold uppercase tracking-widest text-[var(--text-primary)] transition hover:bg-[var(--accent-green)] hover:px-5"
              >
                {link.label}
              </Link>
            ))}
            {session ? (
              <>
                <Link
                  href="/my-submissions"
                  onClick={() => setIsOpen(false)}
                  className="border-b-[2px] border-[var(--line)]/50 px-3 py-4 font-mono text-sm font-bold uppercase tracking-widest text-[var(--text-primary)] transition hover:bg-[var(--accent-green)] hover:px-5"
                >
                  My Entries
                </Link>
                {session.isAdmin ? (
                  <Link
                    href="/admin/weeks"
                    onClick={() => setIsOpen(false)}
                    className="border-b-[2px] border-[var(--line)]/50 px-3 py-4 font-mono text-sm font-bold uppercase tracking-widest text-[var(--text-primary)] transition hover:bg-[var(--accent-green)] hover:px-5"
                  >
                    Admin
                  </Link>
                ) : null}
                <div className="flex items-center justify-between px-3 py-4">
                  <span className="font-mono text-xs text-[var(--text-secondary)]">
                    {session.displayName}
                  </span>
                  <LogoutButton dataMode={dataMode} />
                </div>
              </>
            ) : (
              <div className="py-3">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="brutal-btn brutal-btn-dark w-full text-center"
                >
                  Sign in
                </Link>
              </div>
            )}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
