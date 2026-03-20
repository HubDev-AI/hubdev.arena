import type { Metadata } from "next";
import Link from "next/link";

import { requireAdminSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

export const metadata: Metadata = {
  title: "Admin: Weeks",
  robots: { index: false, follow: false },
};

import { CreateWeekForm } from "./create-week-form";

export const dynamic = "force-dynamic";

export default async function AdminWeeksPage() {
  await requireAdminSession("/admin/weeks");
  const weeks = await getArenaService().listWeeks();

  return (
    <div className="page-bg page-bg-default">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <div className="space-y-5">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
              Admin weeks
            </p>
            <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em] text-[var(--ink)]">
              Weekly round control
            </h1>
          </div>

          <div className="space-y-4">
            {weeks.map((week) => {
              const statusColor = week.status === "voting_open"
                ? "bg-[var(--accent-green)]"
                : week.status === "locked"
                  ? "bg-[var(--accent-blue)]"
                  : week.status === "submissions_open"
                    ? "bg-[var(--accent-yellow)]"
                    : "bg-[var(--bg)]";
              return (
                <Link
                  key={week.id}
                  href={`/admin/weeks/${week.slug}`}
                  className="brutal-card relative block overflow-hidden p-6"
                >
                  <div className={`absolute left-0 top-0 h-full w-1.5 ${statusColor}`} />
                  <div className="flex flex-wrap items-start justify-between gap-4 pl-3">
                    <div>
                      <p className="brutal-label">
                        {week.status.replaceAll("_", " ")}
                      </p>
                      <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.05em] text-[var(--ink)]">
                        {week.themeTitle}
                      </h2>
                      <p className="mt-2 text-sm text-[var(--muted)]">{week.themeDescription}</p>
                    </div>
                    <span className="brutal-badge">
                      {week.slug}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <CreateWeekForm />
      </div>
    </div>
  );
}
