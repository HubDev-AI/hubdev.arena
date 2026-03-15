import Link from "next/link";

import type { BuilderSession } from "@/lib/server/auth";
import { LogoutButton } from "@/components/logout-button";

export function SiteHeader({ session, dataMode }: { session: BuilderSession | null; dataMode?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-[var(--ink)] bg-[var(--surface)]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border-[3px] border-[var(--ink)] bg-[var(--ink)] font-mono text-xs font-bold uppercase tracking-wider text-[var(--surface)] transition group-hover:bg-[var(--accent-green)] group-hover:text-[var(--ink)]">
            HA
          </div>
          <div className="hidden sm:block">
            <p className="brutal-label">Weekly battles for AI-built apps</p>
            <p className="text-lg font-black tracking-tight text-[var(--ink)]">
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
              className="border-2 border-transparent px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest text-[var(--ink)] transition hover:border-[var(--ink)] hover:bg-[var(--accent-green)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-[var(--ink)]">{session.displayName}</p>
                <p className="brutal-label">
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
              <LogoutButton dataMode={dataMode} />
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
