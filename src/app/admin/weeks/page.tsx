import { createWeekAction } from "@/app/admin/actions";
import { requireAdminSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";
import { WeekTable } from "@/components/admin/week-table";

export const dynamic = "force-dynamic";

export default async function AdminWeeksPage() {
  await requireAdminSession("/admin/weeks");
  const service = getArenaService();
  const weeks = await service.listWeeks();

  // Load entry counts for each week in parallel
  const weeksWithCounts = await Promise.all(
    weeks.map(async (week) => {
      // Re-use the repository-level list rather than the full admin detail
      const entries = await service.getWeekAdminDetail(week.slug).then((d) => d.entries);
      return {
        ...week,
        pendingCount: entries.filter((e) => e.status === "pending").length,
        approvedCount: entries.filter((e) => e.status === "approved").length,
        rejectedCount: entries.filter((e) => e.status === "rejected").length,
      };
    }),
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
            Admin
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em] text-[var(--ink)]">
            Weekly round control
          </h1>
        </div>
      </div>

      {/* Weeks table */}
      <div className="mb-12 rounded-[2rem] border border-[var(--line)] bg-white/84 p-6 shadow-[0_20px_60px_rgba(8,18,30,0.08)]">
        {weeksWithCounts.length === 0 ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
            No weeks yet. Create one below.
          </p>
        ) : (
          <WeekTable weeks={weeksWithCounts} />
        )}
      </div>

      {/* Create week form */}
      <form
        id="create"
        action={createWeekAction}
        className="space-y-4 rounded-[2rem] border border-[var(--line)] bg-white/86 p-6 shadow-[0_20px_60px_rgba(8,18,30,0.08)]"
      >
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
            Create week
          </p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.05em] text-[var(--ink)]">
            Seed the next round
          </h2>
        </div>
        {[
          ["slug", "Slug", "launch-week"],
          ["themeTitle", "Theme title", "Agents That Ship"],
          ["timezone", "Timezone", "America/Los_Angeles"],
          ["submissionOpenAt", "Submission open", "2026-03-12T20:00:00.000Z"],
          ["submissionCloseAt", "Submission close", "2026-03-16T06:59:00.000Z"],
          ["votingOpenAt", "Voting open", "2026-03-16T16:00:00.000Z"],
          ["votingCloseAt", "Voting close", "2026-03-19T06:59:00.000Z"],
        ].map(([name, label, placeholder]) => (
          <label key={name} className="space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
              {label}
            </span>
            <input
              required
              name={name}
              className="w-full rounded-[1.3rem] border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--cobalt)]"
              placeholder={placeholder}
            />
          </label>
        ))}
        <label className="space-y-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
            Theme description
          </span>
          <textarea
            required
            name="themeDescription"
            rows={4}
            className="w-full rounded-[1.3rem] border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--cobalt)]"
            placeholder="Build the most compelling AI-powered app that feels production-ready after a single session."
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--paper)] transition hover:bg-[var(--cobalt)]"
        >
          Create draft week
        </button>
      </form>
    </div>
  );
}
