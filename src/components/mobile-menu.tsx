"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  // H22: Focus trap and body scroll lock
  const openMenu = useCallback(() => {
    previousFocusRef.current = document.activeElement;
    setIsOpen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    document.body.style.overflow = "";
    // Restore focus to the element that opened the menu
    if (previousFocusRef.current instanceof HTMLElement) {
      previousFocusRef.current.focus();
    }
  }, []);

  // Focus first menu item when menu opens
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const firstFocusable = menuRef.current.querySelector<HTMLElement>(
      'a, button, input, [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
        return;
      }

      // H22: Trap Tab/Shift+Tab within the menu
      if (e.key === "Tab" && menuRef.current) {
        const focusableElements = menuRef.current.querySelectorAll<HTMLElement>(
          'a, button, input, [tabindex]:not([tabindex="-1"])',
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, closeMenu]);

  // Restore scroll on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={isOpen ? closeMenu : openMenu}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-menu"
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
        <div
          ref={menuRef}
          id="mobile-nav-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="animate-slide-up absolute left-0 right-0 top-full z-50 border-b border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
        >
          <nav className="stagger-children mx-auto flex max-w-6xl flex-col px-4 py-2 sm:px-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="border-b-[2px] border-[var(--line)]/50 px-3 py-4 font-mono text-sm font-bold uppercase tracking-widest text-[var(--text-primary)] transition hover:bg-[var(--accent-green)] hover:px-5"
              >
                {link.label}
              </Link>
            ))}
            {session ? (
              <>
                <Link
                  href="/my-submissions"
                  onClick={closeMenu}
                  className="border-b-[2px] border-[var(--line)]/50 px-3 py-4 font-mono text-sm font-bold uppercase tracking-widest text-[var(--text-primary)] transition hover:bg-[var(--accent-green)] hover:px-5"
                >
                  My Entries
                </Link>
                {session.isAdmin ? (
                  <Link
                    href="/admin/weeks"
                    onClick={closeMenu}
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
                  onClick={closeMenu}
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
