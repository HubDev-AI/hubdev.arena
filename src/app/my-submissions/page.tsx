import Link from "next/link";

import { requireBuilderSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  pending:
    "border-[2px] border-amber-500 bg-amber-100 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amber-800",
  approved:
    "border-[2px] border-[var(--accent-green)] bg-green-100 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-green-800",
  rejected:
    "border-[2px] border-red-500 bg-red-100 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-red-800",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function MySubmissionsPage() {
  const session = await requireBuilderSession("/my-submissions");
  const arenaService = getArenaService();
  const groups = await arenaService.getMySubmissions(session.userId);
  const now = new Date();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
          My submissions
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em] text-[var(--ink)]">
          Builder dashboard
        </h1>
      </div>

      {groups.length > 0 ? (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.week.id} className="brutal-card p-6">
              {/* Week header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b-[2px] border-[var(--ink)] pb-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
                    {group.week.status.replaceAll("_", " ")}
                  </span>
                  <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-[var(--ink)]">
                    {group.week.themeTitle}
                  </h2>
                </div>
              </div>

              {/* Entry cards */}
              <div className="mt-4 grid gap-4">
                {group.entries.map((entry) => (
                  <div key={entry.id} className="border-[2px] border-[var(--ink)] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xl font-black tracking-tight text-[var(--ink)]">
                          {entry.title}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">{entry.oneLiner}</p>
                        <p className="mt-1 font-mono text-[10px] text-[var(--muted)] uppercase tracking-[0.2em]">
                          Submitted {formatDate(entry.submittedAt)}
                        </p>
                      </div>
                      <span className={STATUS_STYLE[entry.status] ?? STATUS_STYLE.pending}>
                        {entry.status}
                      </span>
                    </div>

                    {/* Status-specific content */}
                    {entry.status === "rejected" && entry.rejectionNote && (
                      <p className="mt-4 border-[2px] border-red-400 bg-red-50 px-4 py-3 font-mono text-xs font-bold text-red-700">
                        Rejection note: {entry.rejectionNote}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3">
                      {entry.status === "pending" && (
                        <Link
                          href="/submit"
                          className="brutal-btn brutal-btn-outline text-[11px] px-3 py-2"
                        >
                          Edit submission →
                        </Link>
                      )}

                      {entry.status === "rejected" &&
                        group.week.status === "submissions_open" &&
                        now < new Date(group.week.submissionCloseAt) && (
                          <Link
                            href="/submit"
                            className="brutal-btn brutal-btn-green text-[11px] px-3 py-2"
                          >
                            Resubmit →
                          </Link>
                        )}

                      {entry.status === "approved" && (
                        <>
                          {(group.week.status === "voting_open" ||
                            group.week.status === "locked" ||
                            group.week.status === "archived") && (
                            <div className="flex gap-4 font-mono text-sm font-bold text-[var(--ink)]">
                              <span>ELO {entry.eloRating}</span>
                              <span>
                                {entry.wins}W / {entry.losses}L
                              </span>
                            </div>
                          )}
                          <Link
                            href={`/entry/${entry.slug}`}
                            className="brutal-btn brutal-btn-outline text-[11px] px-3 py-2"
                          >
                            View entry →
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="brutal-card p-6">
          <p className="text-base leading-7 text-[var(--muted)]">
            You have not submitted an entry yet.{" "}
            <Link href="/submit" className="font-bold text-[var(--ink)] underline hover:text-[var(--accent-blue)]">
              Submit your first app →
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
