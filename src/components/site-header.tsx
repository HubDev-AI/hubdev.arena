import Link from "next/link";

import type { BuilderSession } from "@/lib/server/auth";
import { LogoutButton } from "@/components/logout-button";

export function SiteHeader({ session }: { session: BuilderSession | null }) {
  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "var(--white)",
        borderBottom: "var(--border-thick)",
        padding: 0,
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              border: "3px solid var(--black)",
              background: "var(--black)",
              fontFamily: "var(--font-mono, 'Space Mono', monospace)",
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--white)",
              transition: "background 0.15s, color 0.15s",
              flexShrink: 0,
            }}
            className="group-hover:bg-[var(--green)] group-hover:text-[var(--black)]"
          >
            HA
          </div>
          <div className="hidden sm:block">
            <p
              style={{
                fontFamily: "var(--font-mono, 'Space Mono', monospace)",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.28em",
                color: "var(--muted)",
              }}
            >
              Weekly battles for AI-built apps
            </p>
            <p
              style={{
                fontFamily: "var(--font-heading, 'Syne', sans-serif)",
                fontWeight: 900,
                fontSize: "1.125rem",
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                color: "var(--black)",
                lineHeight: 1.1,
              }}
            >
              HubDev Arena
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            { href: "/vote", label: "Vote" },
            { href: "/leaderboard", label: "Board" },
            { href: "/rules", label: "Rules" },
            { href: "/submit", label: "Submit" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontFamily: "var(--font-mono, 'Space Mono', monospace)",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "var(--black)",
                padding: "0.5rem 0.75rem",
                border: "2px solid transparent",
                textDecoration: "none",
                transition: "border-color 0.1s, background 0.1s",
              }}
              className="hover:border-[var(--black)] hover:bg-[var(--green)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <div className="hidden text-right sm:block">
                <p
                  style={{
                    fontFamily: "var(--font-mono, 'Space Mono', monospace)",
                    fontWeight: 700,
                    fontSize: 13,
                    color: "var(--black)",
                  }}
                >
                  @{session.displayName}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-mono, 'Space Mono', monospace)",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.28em",
                    color: "var(--muted)",
                  }}
                >
                  {session.isAdmin ? "Admin" : "Member"}
                </p>
              </div>
              <Link
                href="/my-submissions"
                className="brutal-btn brutal-btn-outline text-[10px] px-3 py-2"
              >
                Entries
              </Link>
              {session.isAdmin ? (
                <Link
                  href="/admin/weeks"
                  className="brutal-btn brutal-btn-dark text-[10px] px-3 py-2"
                >
                  Admin
                </Link>
              ) : null}
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="brutal-btn brutal-btn-dark text-[10px] px-3 py-2"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
