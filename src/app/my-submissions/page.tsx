import type { Metadata } from "next";
import Link from "next/link";

import { AuroraBg } from "@/components/aurora-bg";
import { GlitchText } from "@/components/glitch-text";
import { ScrollReveal } from "@/components/scroll-reveal";
import type { WeekStatus } from "@/lib/domain/weeks";
import { requireBuilderSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";
import type { Entry, Week } from "@/lib/server/types";

export const metadata: Metadata = {
  title: "My Submissions",
  description:
    "View and manage your AI-built app submissions on HubDev Arena.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<WeekStatus, string> = {
  draft: "Draft",
  submissions_open: "Accepting Submissions",
  voting_open: "Voting Open",
  locked: "Results Locked",
  archived: "Archived",
};

const ENTRY_STATUS_ICONS: Record<string, string> = {
  approved: "\u2713",
  rejected: "\u2715",
  pending: "\u25F7",
};

function sortGroupsByDate(
  groups: Array<{ week: Week; entries: Entry[] }>,
): Array<{ week: Week; entries: Entry[] }> {
  return [...groups].sort(
    (a, b) =>
      new Date(b.week.submissionOpenAt).getTime() -
      new Date(a.week.submissionOpenAt).getTime(),
  );
}

export default async function MySubmissionsPage() {
  const session = await requireBuilderSession("/my-submissions");
  const service = getArenaService();
  const groups = await service.getMySubmissions(session.userId);

  // Sort groups by date descending (most recent first) — H37
  const sortedGroups = sortGroupsByDate(groups);

  // Fetch current week for enriched empty state — M59
  const currentWeek = groups.length === 0 ? await service.getCurrentWeek() : null;

  return (
    <div className="page-bg page-bg-default">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="brutal-card relative overflow-hidden bg-[var(--ink)] p-6 text-white sm:p-8 neon-box">
          <AuroraBg />
          <div className="relative z-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)] neon-text">
              My Submissions
            </p>
            <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em] text-white">
              <GlitchText text="My Submissions" className="text-white" />
            </h1>
            <p className="mt-3 text-sm text-gray-400">Track your submissions across all competition weeks.</p>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-blue)] to-transparent" />
        </div>

        {sortedGroups.length > 0 ? (
          <div className="space-y-5">
            {sortedGroups.map((group, groupIdx) => (
              <ScrollReveal key={group.week.id} delay={groupIdx * 100}>
                <section className="brutal-card p-6 holo-shimmer hover-lift">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="brutal-label">
                        {STATUS_LABELS[group.week.status] ?? group.week.status}
                      </p>
                      <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em] text-[var(--text-primary)]">
                        {group.week.themeTitle}
                      </h2>
                    </div>
                    <span className="brutal-badge brutal-badge-elo">
                      {group.week.slug}
                    </span>
                  </div>
                  <div className="mt-6 grid gap-4">
                    {group.entries.map((entry) => {
                      const statusColor = entry.status === "approved"
                        ? "bg-[var(--accent-green)]"
                        : entry.status === "rejected"
                          ? "bg-[var(--accent-red)]"
                          : "bg-[var(--accent-yellow)]";
                      const glowColor = entry.status === "approved"
                        ? "rgba(0, 255, 65, 0.15)"
                        : entry.status === "rejected"
                          ? "rgba(255, 51, 51, 0.15)"
                          : "rgba(255, 214, 0, 0.15)";
                      const statusIcon = ENTRY_STATUS_ICONS[entry.status] ?? "";
                      return (
                        <div
                          key={entry.id}
                          className="relative overflow-hidden border-[2px] border-[var(--line)] bg-[var(--surface)] px-5 py-4 transition-all hover:translate-x-1"
                          style={{ boxShadow: `0 0 10px ${glowColor}` }}
                        >
                          <div className={`absolute left-0 top-0 h-full w-1.5 ${statusColor}`} style={{ boxShadow: `0 0 8px ${glowColor}` }} />
                          <div className="flex flex-wrap items-start justify-between gap-4 pl-3">
                            <div>
                              <p className="text-xl font-black tracking-[-0.04em] text-[var(--text-primary)]">
                                <Link
                                  href={`/entry/${entry.slug}`}
                                  className="underline-offset-2 transition-colors hover:text-[var(--accent-green)] hover:underline"
                                >
                                  {entry.title}
                                </Link>
                              </p>
                              <p className="mt-2 text-sm text-[var(--text-secondary)]">{entry.oneLiner}</p>
                              {/* M60: Performance stats for approved entries */}
                              {entry.status === "approved" && (
                                <div className="mt-2 flex flex-wrap gap-3 font-mono text-xs text-[var(--text-secondary)]">
                                  <span title="ELO Rating">ELO: {entry.eloRating}</span>
                                  <span className="text-[var(--line)]" aria-hidden="true">|</span>
                                  <span title="Wins" className="text-emerald-500">{entry.wins}W</span>
                                  <span className="text-[var(--line)]" aria-hidden="true">|</span>
                                  <span title="Losses" className="text-red-400">{entry.losses}L</span>
                                  <span className="text-[var(--line)]" aria-hidden="true">|</span>
                                  <span title="Matchup appearances">
                                    {entry.appearanceCount} matchup{entry.appearanceCount !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              )}
                            </div>
                            {/* M61: Add icon alongside status badge */}
                            <span className={`brutal-badge ${entry.status === "approved" ? "brutal-badge-green" : ""}`}>
                              <span aria-hidden="true" className="mr-1">{statusIcon}</span>
                              {entry.status}
                            </span>
                          </div>
                          {entry.status === "rejected" && entry.rejectionNote ? (
                            <p className="mt-3 pl-3 text-sm text-red-400">
                              {entry.rejectionNote}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </section>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="brutal-card p-8 neon-box">
            <div className="flex flex-col items-center text-center">
              {/* M59: Visual illustration */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center border-[3px] border-[var(--line)] bg-[var(--surface)]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-black uppercase tracking-[-0.04em] text-[var(--text-primary)]">
                No submissions yet
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
                Build something amazing and submit it to the arena. Every week brings a new theme and a fresh chance to compete.
              </p>
              {/* M59: Current week theme if available */}
              {currentWeek && (
                <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
                  This week&apos;s theme:{" "}
                  <span className="text-[var(--accent-green)]">{currentWeek.themeTitle}</span>
                </p>
              )}
              <Link href="/submit" className="brutal-btn brutal-btn-green mt-6 hover-lift">
                Submit your first entry
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
