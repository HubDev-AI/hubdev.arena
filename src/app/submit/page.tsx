import { SubmitForm } from "@/components/submit-form";
import { requireBuilderSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}

export default async function SubmitPage() {
  const session = await requireBuilderSession("/submit");
  const arenaService = getArenaService();
  const week = await arenaService.getCurrentWeek();

  // Week-state gate
  if (!week || !["submissions_open"].includes(week.status)) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
            Builder submission
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em] text-[var(--ink)]">
            Ship one entry this week
          </h1>
        </div>
        <div className="brutal-card p-6">
          <p className="text-base leading-7 text-[var(--muted)]">
            No week is currently open for submissions. An admin needs to create or open the next
            round first.
          </p>
        </div>
      </div>
    );
  }

  // Gap check — submissions closed even though status is submissions_open
  const now = new Date();
  if (now > new Date(week.submissionCloseAt)) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
            Builder submission
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em] text-[var(--ink)]">
            Submissions closed
          </h1>
        </div>
        <div className="brutal-card p-6">
          <p className="text-base leading-7 text-[var(--muted)]">
            The submission window for <strong>{week.themeTitle}</strong> has closed. Voting opens{" "}
            {formatDate(week.votingOpenAt)}.
          </p>
        </div>
      </div>
    );
  }

  // Load existing entry if any
  const builderEntries = await arenaService.getMySubmissions(session.userId);
  const currentWeekGroup = builderEntries.find((g) => g.week.id === week.id);
  const existingEntry = currentWeekGroup?.entries[0] ?? null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
          Builder submission
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em] text-[var(--ink)]">
          {existingEntry ? "Edit your entry" : "Ship one entry this week"}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
          A live URL and one demo asset are required. Submissions stay pending until an admin
          approves them.
        </p>
      </div>

      {/* Week info card */}
      <div className="brutal-card p-5">
        <p className="brutal-label">Open week</p>
        <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-[var(--ink)]">
          {week.themeTitle}
        </p>
        <p className="mt-2 text-base text-[var(--muted)]">{week.themeDescription}</p>
      </div>

      <SubmitForm
        weekSlug={week.slug}
        existingEntry={
          existingEntry
            ? {
                id: existingEntry.id,
                title: existingEntry.title,
                oneLiner: existingEntry.oneLiner,
                liveUrl: existingEntry.liveUrl,
                status: existingEntry.status,
                rejectionNote: existingEntry.rejectionNote,
              }
            : null
        }
        userId={session.userId}
      />
    </div>
  );
}
