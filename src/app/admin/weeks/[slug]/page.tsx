import Link from "next/link";

import {
  archiveWeekAction,
  lockWeekAction,
  openSubmissionsAction,
  openVotingAction,
  reviewEntryAction,
} from "@/app/admin/actions";
import { requireAdminSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

export const dynamic = "force-dynamic";

export default async function AdminWeekDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdminSession("/admin/weeks");
  const { slug } = await params;
  const detail = await getArenaService().getWeekAdminDetail(slug);

  const statusColor =
    detail.week.status === "voting_open"
      ? "var(--accent-green)"
      : detail.week.status === "submissions_open"
        ? "var(--accent-yellow)"
        : detail.week.status === "locked"
          ? "var(--accent-blue)"
          : "var(--muted)";

  return (
    <div className="page-bg page-bg-default">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        {/* Dark hero header */}
        <div className="brutal-card relative overflow-hidden arena-hero-bg p-6 text-white sm:p-8">
          <div className="absolute right-0 top-0 h-20 w-20" style={{ background: statusColor, clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,1) 10px, rgba(255,255,255,1) 11px)",
          }} />
          <div className="absolute bottom-0 left-0 h-1 w-full" style={{ background: `linear-gradient(to right, ${statusColor}, transparent)` }} />

          <Link href="/admin/weeks" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-gray-400 transition hover:text-white">
            &larr; All weeks
          </Link>

          <div className="mt-4">
            <div className="flex items-center gap-3">
              <span className="inline-block rounded-sm px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider" style={{ background: statusColor, color: "var(--ink)" }}>
                {detail.week.status.replaceAll("_", " ")}
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              {detail.week.themeTitle}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-300">
              {detail.week.themeDescription}
            </p>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <div className="border-[2px] border-gray-700 bg-gray-900 p-3 border-t-[3px] border-t-[var(--accent-green)]">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-400">Entries</p>
              <p className="mt-1 text-lg font-black text-white">{detail.entries.length}</p>
            </div>
            <div className="border-[2px] border-gray-700 bg-gray-900 p-3 border-t-[3px] border-t-[var(--accent-blue)]">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-400">Matchups</p>
              <p className="mt-1 text-lg font-black text-white">{detail.matchups.length}</p>
            </div>
            <div className="border-[2px] border-gray-700 bg-gray-900 p-3 border-t-[3px] border-t-[var(--accent-yellow)]">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-400">Approved</p>
              <p className="mt-1 text-lg font-black text-[var(--accent-green)]">{detail.entries.filter(e => e.status === "approved").length}</p>
            </div>
            <div className="border-[2px] border-gray-700 bg-gray-900 p-3 border-t-[3px]" style={{ borderTopColor: statusColor }}>
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-400">Pending</p>
              <p className="mt-1 text-lg font-black text-[var(--accent-yellow)]">{detail.entries.filter(e => e.status === "pending").length}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="brutal-card overflow-hidden p-0 border-l-[4px]" style={{ borderLeftColor: statusColor }}>
          <div className="bg-[var(--ink)] px-5 py-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">Week actions</p>
          </div>
          <div className="flex flex-wrap gap-3 p-5">
            {detail.week.status === "draft" ? (
              <form action={openSubmissionsAction}>
                <input type="hidden" name="weekSlug" value={detail.week.slug} />
                <button type="submit" className="brutal-btn brutal-btn-green">
                  Open submissions
                </button>
              </form>
            ) : null}

            {detail.week.status === "submissions_open" ? (
              <form action={openVotingAction}>
                <input type="hidden" name="weekSlug" value={detail.week.slug} />
                <button type="submit" className="brutal-btn brutal-btn-green">
                  Generate matchups + open voting
                </button>
              </form>
            ) : null}

            {detail.week.status === "voting_open" ? (
              <form action={lockWeekAction}>
                <input type="hidden" name="weekSlug" value={detail.week.slug} />
                <button type="submit" className="brutal-btn brutal-btn-blue">
                  Lock results
                </button>
              </form>
            ) : null}

            {detail.week.status === "locked" ? (
              <form action={archiveWeekAction}>
                <input type="hidden" name="weekSlug" value={detail.week.slug} />
                <button type="submit" className="brutal-btn brutal-btn-outline">
                  Archive week
                </button>
              </form>
            ) : null}

            <Link href="/admin/weeks" className="brutal-btn brutal-btn-outline">
              Back to weeks
            </Link>
          </div>
        </div>

        {/* Entries */}
        <section className="brutal-card overflow-hidden p-0">
          <div className="flex items-center justify-between bg-[var(--ink)] px-5 py-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
              Entry moderation
            </p>
            <span className="brutal-badge brutal-badge-green">
              {detail.entries.length} total
            </span>
          </div>

          {detail.entries.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-[var(--muted)]">No entries submitted yet.</p>
            </div>
          ) : (
            <div className="divide-y-[2px] divide-[var(--ink)]">
              {detail.entries.map((entry) => {
                const entryColor =
                  entry.status === "approved" ? "var(--accent-green)"
                  : entry.status === "pending" ? "var(--accent-yellow)"
                  : "var(--accent-red)";
                return (
                  <div key={entry.id} className="relative p-5 pl-7">
                    <div className="absolute left-0 top-0 h-full w-1.5" style={{ background: entryColor }} />
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-black tracking-tight text-[var(--ink)]">
                          {entry.title}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {entry.oneLiner}
                        </p>
                      </div>
                      <span className="inline-block rounded-sm border-[2px] border-[var(--ink)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase" style={{ background: entryColor, color: "var(--ink)" }}>
                        {entry.status}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={entry.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="brutal-btn brutal-btn-outline text-[10px] px-3 py-1.5"
                      >
                        Open app
                      </a>
                      {detail.week.status === "submissions_open" ? (
                        <>
                          <form action={reviewEntryAction}>
                            <input type="hidden" name="weekSlug" value={detail.week.slug} />
                            <input type="hidden" name="entryId" value={entry.id} />
                            <input type="hidden" name="decision" value="approved" />
                            <button type="submit" className="brutal-btn brutal-btn-green text-[10px] px-3 py-1.5">
                              Approve
                            </button>
                          </form>
                          <form action={reviewEntryAction}>
                            <input type="hidden" name="weekSlug" value={detail.week.slug} />
                            <input type="hidden" name="entryId" value={entry.id} />
                            <input type="hidden" name="decision" value="rejected" />
                            <button type="submit" className="brutal-btn brutal-btn-outline text-[10px] px-3 py-1.5" style={{ borderColor: "var(--accent-red)", color: "var(--accent-red)" }}>
                              Reject
                            </button>
                          </form>
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
