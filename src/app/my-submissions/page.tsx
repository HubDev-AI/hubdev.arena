import type { Metadata } from "next";
import Link from "next/link";

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
        <div className="brutal-card overflow-hidden p-6 sm:p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
            My submissions
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em] text-[var(--ink)]">
            Builder dashboard
          </h1>
          <div className="mt-4 h-[3px] w-full" style={{ background: "linear-gradient(to right, var(--accent-green), var(--accent-blue), transparent)" }} />
        </div>

        {groups.length > 0 ? (
          <div className="space-y-5">
            {groups.map((group) => (
              <section key={group.week.id} className="brutal-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="brutal-label">
                      {group.week.status.replaceAll("_", " ")}
                    </p>
                    <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em] text-[var(--ink)]">
                      {group.week.themeTitle}
                    </h2>
                  </div>
                  <span className="border-[2px] border-[var(--ink)] bg-[var(--accent-green)] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink)]">
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
                    return (
                      <div
                        key={entry.id}
                        className="relative overflow-hidden border-[2px] border-[var(--ink)] bg-[var(--paper)] px-5 py-4"
                      >
                        <div className={`absolute left-0 top-0 h-full w-1 ${statusColor}`} />
                        <div className="flex flex-wrap items-start justify-between gap-4 pl-3">
                          <div>
                            <p className="text-xl font-black tracking-[-0.04em] text-[var(--ink)]">
                              {entry.title}
                            </p>
                            <p className="mt-2 text-sm text-[var(--muted)]">{entry.oneLiner}</p>
                          </div>
                          <span className={`brutal-badge ${entry.status === "approved" ? "brutal-badge-green" : ""}`}>
                            {entry.status}
                          </span>
                        </div>
                        {entry.status === "rejected" && entry.rejectionNote ? (
                          <p className="mt-3 pl-3 text-sm text-red-700">
                            {entry.rejectionNote}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="brutal-card p-6">
            <p className="text-base leading-7 text-[var(--muted)]">
              You have not submitted an entry yet.
            </p>
            <Link href="/submit" className="brutal-btn brutal-btn-green mt-4">
              Submit your first entry
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
