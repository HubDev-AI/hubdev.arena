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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[2rem] border border-[var(--line)] bg-white/86 p-6 shadow-[0_20px_60px_rgba(8,18,30,0.08)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
            {detail.week.status.replaceAll("_", " ")}
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em] text-[var(--ink)]">
            {detail.week.themeTitle}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">
            {detail.week.themeDescription}
          </p>
        </div>

        <div className="space-y-3 rounded-[2rem] border border-[var(--line)] bg-white/86 p-6 shadow-[0_20px_60px_rgba(8,18,30,0.08)]">
          {detail.week.status === "draft" ? (
            <form action={openSubmissionsAction}>
              <input type="hidden" name="weekSlug" value={detail.week.slug} />
              <button
                type="submit"
                className="w-full rounded-full bg-[var(--ink)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--paper)] transition hover:bg-[var(--cobalt)]"
              >
                Open submissions
              </button>
            </form>
          ) : null}

          {detail.week.status === "submissions_open" ? (
            <form action={openVotingAction}>
              <input type="hidden" name="weekSlug" value={detail.week.slug} />
              <button
                type="submit"
                className="w-full rounded-full bg-[var(--ink)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--paper)] transition hover:bg-[var(--cobalt)]"
              >
                Generate matchups + open voting
              </button>
            </form>
          ) : null}

          {detail.week.status === "voting_open" ? (
            <form action={lockWeekAction}>
              <input type="hidden" name="weekSlug" value={detail.week.slug} />
              <button
                type="submit"
                className="w-full rounded-full bg-[var(--rust)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--paper)] transition hover:opacity-90"
              >
                Lock results
              </button>
            </form>
          ) : null}

          {detail.week.status === "locked" ? (
            <form action={archiveWeekAction}>
              <input type="hidden" name="weekSlug" value={detail.week.slug} />
              <button
                type="submit"
                className="w-full rounded-full border border-[var(--line)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--ink)] transition hover:border-[var(--ink)] hover:bg-[var(--paper)]"
              >
                Archive week
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <section className="rounded-[2rem] border border-[var(--line)] bg-white/84 p-6 shadow-[0_20px_60px_rgba(8,18,30,0.08)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
              Entry moderation
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em] text-[var(--ink)]">
              Submissions
            </h2>
          </div>
          <span className="rounded-full bg-[var(--acid)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--ink)]">
            {detail.entries.length} total
          </span>
        </div>
        <div className="mt-6 grid gap-4">
          {detail.entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-black tracking-[-0.04em] text-[var(--ink)]">
                    {entry.title}
                  </p>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                    {entry.oneLiner}
                  </p>
                </div>
                <span className="rounded-full border border-[var(--line)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
                  {entry.status}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={entry.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink)] transition hover:border-[var(--ink)] hover:bg-white"
                >
                  Open app
                </a>
                {detail.week.status === "submissions_open" ? (
                  <>
                    <form action={reviewEntryAction}>
                      <input type="hidden" name="weekSlug" value={detail.week.slug} />
                      <input type="hidden" name="entryId" value={entry.id} />
                      <input type="hidden" name="decision" value="approved" />
                      <button
                        type="submit"
                        className="rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--paper)] transition hover:bg-[var(--cobalt)]"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={reviewEntryAction}>
                      <input type="hidden" name="weekSlug" value={detail.week.slug} />
                      <input type="hidden" name="entryId" value={entry.id} />
                      <input type="hidden" name="decision" value="rejected" />
                      <button
                        type="submit"
                        className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink)] transition hover:border-[var(--ink)] hover:bg-white"
                      >
                        Reject
                      </button>
                    </form>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-[var(--line)] bg-white/84 p-6 shadow-[0_20px_60px_rgba(8,18,30,0.08)]">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
          Matchups generated
        </p>
        <p className="mt-2 text-3xl font-black uppercase tracking-[-0.05em] text-[var(--ink)]">
          {detail.matchups.length}
        </p>
      </section>
    </div>
  );
}
