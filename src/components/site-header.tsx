import Link from "next/link";

import type { BuilderSession } from "@/lib/server/auth";
import { LogoutButton } from "@/components/logout-button";
import { MobileMenu } from "@/components/mobile-menu";

const NAV_LINKS = [
  { href: "/vote", label: "Vote" },
  { href: "/leaderboard", label: "Board" },
  { href: "/rules", label: "Rules" },
  { href: "/submit", label: "Submit" },
];

export function SiteHeader({ session, dataMode }: { session: BuilderSession | null; dataMode?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center border border-[var(--accent-green)]/30 bg-[var(--surface)] font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent-green)] shadow-[0_0_10px_rgba(0,255,65,0.15)] transition-all group-hover:bg-[var(--accent-green)] group-hover:text-[var(--ink)] group-hover:shadow-[0_0_20px_rgba(0,255,65,0.4)]">
            HA
          </div>
          <div className="hidden sm:block">
            <p className="brutal-label">Weekly battles for AI-built apps</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-black tracking-tight text-[var(--text-primary)]">
                HubDev Arena
              </p>
              {/* M34: Increase text-[8px] to text-[11px] minimum */}
              <span className="inline-flex items-center gap-1 rounded-sm border border-[var(--accent-green)]/20 bg-[var(--accent-green)]/5 px-1.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--accent-green)]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent-green)] opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent-green)]" />
                </span>
                Live
              </span>
            </div>
          </div>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="animated-underline border-2 border-transparent px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] transition-all hover:border-[var(--accent-green)] hover:bg-[var(--accent-green)]/10 hover:text-[var(--accent-green)] hover:shadow-[0_0_10px_rgba(0,255,65,0.15)] focus-visible:border-[var(--accent-green)] focus-visible:bg-[var(--accent-green)]/10 focus-visible:outline-none"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* M39: Desktop auth controls — changed sm:flex to md:flex to match nav links breakpoint */}
          <div className="hidden items-center gap-2 md:flex">
            {session ? (
              <>
                <div className="flex items-center gap-2.5 rounded-sm border border-[var(--accent-green)]/20 bg-[var(--accent-green)]/5 px-3 py-1.5 transition-all hover:border-[var(--accent-green)]/40 hover:shadow-[0_0_12px_rgba(0,255,65,0.1)]">
                  {/* Initials avatar — M34: increase text-[10px] to text-[11px] */}
                  <div className="flex h-7 w-7 items-center justify-center bg-[var(--accent-green)]/10 font-mono text-[11px] font-bold text-[var(--accent-green)]" style={{ boxShadow: "inset 0 0 8px rgba(0, 255, 65, 0.08)" }}>
                    {session.displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold leading-tight text-[var(--text-primary)]">{session.displayName}</p>
                    {/* M34: Increase text-[8px] to text-[11px] minimum */}
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] leading-tight text-[var(--accent-green)]">
                      {session.isAdmin ? "Admin" : "Member"}
                    </p>
                  </div>
                </div>
                <Link
                  href="/my-submissions"
                  className="brutal-btn brutal-btn-outline text-[11px] px-3 py-2"
                >
                  Entries
                </Link>
                {session.isAdmin ? (
                  <Link
                    href="/admin/weeks"
                    className="brutal-btn brutal-btn-dark text-[11px] px-3 py-2"
                  >
                    Admin
                  </Link>
                ) : null}
                <LogoutButton dataMode={dataMode} />
              </>
            ) : (
              <Link
                href="/login"
                className="brutal-btn brutal-btn-dark text-[11px] px-3 py-2"
              >
                Sign in
              </Link>
            )}
          </div>
          <MobileMenu session={session} dataMode={dataMode} navLinks={NAV_LINKS} />
        </div>
      </div>
      <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg, transparent, var(--accent-green), var(--accent-blue), var(--accent-green), transparent)", backgroundSize: "200% 100%", animation: "border-flow 4s ease infinite" }} />
    </header>
  );
}
