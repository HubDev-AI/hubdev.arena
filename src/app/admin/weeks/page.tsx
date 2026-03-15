import Link from "next/link";

import { requireAdminSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

import { CreateWeekForm } from "./create-week-form";

export const dynamic = "force-dynamic";

export default async function AdminWeeksPage() {
  await requireAdminSession("/admin/weeks");
  const weeks = await getArenaService().listWeeks();

  return (
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
          {weeks.map((week) => (
            <Link
              key={week.id}
              href={`/admin/weeks/${week.slug}`}
              className="block rounded-[2rem] border border-[var(--line)] bg-white/84 p-6 shadow-[0_20px_60px_rgba(8,18,30,0.08)] transition hover:-translate-y-0.5 hover:border-[var(--ink)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
                    {week.status.replaceAll("_", " ")}
                  </p>
                  <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.05em] text-[var(--ink)]">
                    {week.themeTitle}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">{week.themeDescription}</p>
                </div>
                <span className="rounded-full bg-[var(--acid)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--ink)]">
                  {week.slug}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <CreateWeekForm />
    </div>
  );
}
