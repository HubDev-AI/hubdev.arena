import Link from "next/link";

import { requireAdminSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

import { CreateWeekForm } from "./create-week-form";

export const dynamic = "force-dynamic";

export default async function AdminWeeksPage() {
  await requireAdminSession("/admin/weeks");
  const weeks = await getArenaService().listWeeks();

  return (
    <div className="page-bg page-bg-default">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        {/* Dark hero header */}
        <div className="brutal-card relative overflow-hidden arena-hero-bg p-6 text-white sm:p-8">
          <div className="absolute right-0 top-0 h-20 w-20 bg-[var(--accent-green)]" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,1) 10px, rgba(255,255,255,1) 11px)",
          }} />
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-blue)] to-transparent" />

          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
            Admin panel
          </p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
            Weekly round control
          </h1>
          <p className="mt-2 text-sm text-gray-300">
            Create weeks, manage submissions, control the voting lifecycle.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          {/* Week list */}
          <div className="brutal-card overflow-hidden p-0">
            <div className="bg-[var(--ink)] px-5 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
                All weeks ({weeks.length})
              </p>
            </div>
            {weeks.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-[var(--muted)]">No weeks created yet. Use the form to create the first one.</p>
              </div>
            ) : (
              <div className="divide-y-[2px] divide-[var(--ink)]">
                {weeks.map((week) => {
                  const statusColor =
                    week.status === "voting_open" ? "var(--accent-green)"
                    : week.status === "locked" ? "var(--accent-blue)"
                    : week.status === "submissions_open" ? "var(--accent-yellow)"
                    : "var(--muted)";
                  return (
                    <Link
                      key={week.id}
                      href={`/admin/weeks/${week.slug}`}
                      className="relative block p-5 pl-7 transition hover:bg-[var(--paper)] group"
                    >
                      <div className="absolute left-0 top-0 h-full w-1.5" style={{ background: statusColor }} />
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="inline-block rounded-sm px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider" style={{ background: statusColor, color: "var(--ink)" }}>
                              {week.status.replaceAll("_", " ")}
                            </span>
                          </div>
                          <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-[var(--ink)] group-hover:text-[var(--accent-blue)]">
                            {week.themeTitle}
                          </h2>
                          <p className="mt-1 text-xs text-[var(--muted)]">{week.themeDescription}</p>
                        </div>
                        <span className="font-mono text-[10px] text-[var(--muted)]">{week.slug}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Create week form */}
          <CreateWeekForm />
        </div>
      </div>
    </div>
  );
}
