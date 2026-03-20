import type { Metadata } from "next";
import Link from "next/link";

import { AuroraBg } from "@/components/aurora-bg";
import { GlitchText } from "@/components/glitch-text";
import { ScrollReveal } from "@/components/scroll-reveal";
import { requireBuilderSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

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

export default async function MySubmissionsPage() {
  const session = await requireBuilderSession("/my-submissions");
  const groups = await getArenaService().getMySubmissions(session.userId);

  return (
    <div className="page-bg page-bg-default">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="brutal-card relative overflow-hidden bg-[var(--ink)] p-6 text-white sm:p-8 neon-box">
          <AuroraBg />
          <div className="relative z-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)] neon-text">
              My submissions
            </p>
            <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em] text-white">
              <GlitchText text="Builder dashboard" className="text-white" />
            </h1>
            <p className="mt-3 text-sm text-gray-400">Track your entries across all competition weeks.</p>
          </div>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-blue)] to-transparent" />
        </div>

        {groups.length > 0 ? (
          <div className="space-y-5">
            {groups.map((group, groupIdx) => (
              <ScrollReveal key={group.week.id} delay={groupIdx * 100}>
                <section className="brutal-card p-6 holo-shimmer hover-lift">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="brutal-label">
                        {group.week.status.replaceAll("_", " ")}
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
                                {entry.title}
                              </p>
                              <p className="mt-2 text-sm text-[var(--text-secondary)]">{entry.oneLiner}</p>
                            </div>
                            <span className={`brutal-badge ${entry.status === "approved" ? "brutal-badge-green" : ""}`}>
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
          <div className="brutal-card p-6 neon-box">
            <p className="text-base leading-7 text-[var(--text-secondary)]">
              You have not submitted an entry yet.
            </p>
            <Link href="/submit" className="brutal-btn brutal-btn-green mt-4 hover-lift">
              Submit your first entry
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
