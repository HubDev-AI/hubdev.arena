import type { Metadata } from "next";
import Link from "next/link";

import { AuroraBg } from "@/components/aurora-bg";
import { GlitchText } from "@/components/glitch-text";
import { requireAdminSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const adminSession = await requireAdminSession("/admin");
  const service = getArenaService();

  const weeks = await service.listWeeks();
  const currentWeek = await service.getCurrentWeek();

  // Count pending entries across all active weeks
  let pendingReviewCount = 0;
  const activeWeeks = weeks.filter((w) =>
    ["submissions_open", "voting_open"].includes(w.status),
  );
  for (const week of activeWeeks) {
    const detail = await service.getWeekAdminDetail(adminSession.email, week.slug);
    pendingReviewCount += detail.entries.filter((e) => e.status === "pending").length;
  }

  const currentStatus = currentWeek
    ? currentWeek.status.replaceAll("_", " ")
    : "No active week";

  const statusColor = currentWeek
    ? currentWeek.status === "voting_open"
      ? "var(--accent-green)"
      : currentWeek.status === "submissions_open"
        ? "var(--accent-yellow)"
        : currentWeek.status === "locked"
          ? "var(--accent-blue)"
          : "var(--text-secondary)"
    : "var(--text-secondary)";

  return (
    <div className="page-bg page-bg-default">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero header */}
        <div className="brutal-card neon-box relative overflow-hidden arena-hero-bg p-6 text-white sm:p-8">
          <AuroraBg />
          <div className="absolute right-0 top-0 z-20 h-20 w-20 bg-[var(--accent-green)]" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,1) 10px, rgba(255,255,255,1) 11px)",
          }} />
          <div className="absolute bottom-0 left-0 z-20 h-1 w-full bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-blue)] to-transparent" />
          <div className="relative z-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
              Admin panel
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              <GlitchText text="Command center" />
            </h1>
            <p className="mt-2 text-sm text-gray-300">
              Overview of the arena state and quick navigation.
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="brutal-card border-t-[3px] border-t-[var(--accent-green)] p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-secondary)]">Total weeks</p>
            <p className="mt-2 text-2xl font-black text-[var(--text-primary)]">{weeks.length}</p>
          </div>
          <div className="brutal-card border-t-[3px] border-t-[var(--accent-yellow)] p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-secondary)]">Pending reviews</p>
            <p className="mt-2 text-2xl font-black text-[var(--accent-yellow)]">{pendingReviewCount}</p>
          </div>
          <div className="brutal-card border-t-[3px] p-5 col-span-2 sm:col-span-1" style={{ borderTopColor: statusColor }}>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-secondary)]">Current week</p>
            <p className="mt-2 text-sm font-bold uppercase tracking-wider" style={{ color: statusColor }}>
              {currentStatus}
            </p>
            {currentWeek ? (
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{currentWeek.themeTitle}</p>
            ) : null}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/weeks"
            className="brutal-card group flex items-center gap-4 p-5 transition hover:bg-white/5"
          >
            <div className="flex h-12 w-12 items-center justify-center border-[2px] border-[var(--accent-green)] text-[var(--accent-green)] font-mono text-lg font-black">
              W
            </div>
            <div>
              <p className="text-lg font-black uppercase tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent-green)]">
                Weeks management
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Create, review, and manage weekly rounds
              </p>
            </div>
          </Link>

          {currentWeek ? (
            <Link
              href={`/admin/weeks/${currentWeek.slug}`}
              className="brutal-card group flex items-center gap-4 p-5 transition hover:bg-white/5"
            >
              <div className="flex h-12 w-12 items-center justify-center border-[2px] font-mono text-lg font-black" style={{ borderColor: statusColor, color: statusColor }}>
                !
              </div>
              <div>
                <p className="text-lg font-black uppercase tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent-blue)]">
                  Active week
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {currentWeek.themeTitle}
                </p>
              </div>
            </Link>
          ) : (
            <div className="brutal-card flex items-center gap-4 p-5 opacity-60">
              <div className="flex h-12 w-12 items-center justify-center border-[2px] border-[var(--text-secondary)] text-[var(--text-secondary)] font-mono text-lg font-black">
                -
              </div>
              <div>
                <p className="text-lg font-black uppercase tracking-tight text-[var(--text-secondary)]">
                  No active week
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Create a new week to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
