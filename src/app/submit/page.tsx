import { SubmitForm } from "@/components/submit-form";
import { requireBuilderSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  await requireBuilderSession("/submit");
  const weeks = await getArenaService().listWeeks();
  const openWeek = weeks.find((week) => week.status === "submissions_open");

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
          Builder submission
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em] text-[var(--ink)]">
          Ship one entry this week
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
          A live URL and one demo asset are required. Submissions stay pending until an admin approves them.
        </p>
      </div>

      {openWeek ? (
        <>
          <div className="rounded-[2rem] border border-[var(--line)] bg-white/80 p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
              Open week
            </p>
            <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-[var(--ink)]">
              {openWeek.themeTitle}
            </p>
            <p className="mt-2 text-base text-[var(--muted)]">{openWeek.themeDescription}</p>
          </div>
          <SubmitForm weekSlug={openWeek.slug} />
        </>
      ) : (
        <div className="rounded-[2rem] border border-[var(--line)] bg-white/84 p-6 shadow-[0_20px_60px_rgba(8,18,30,0.08)]">
          <p className="text-base leading-7 text-[var(--muted)]">
            No week is currently open for submissions. An admin needs to create or open the next round first.
          </p>
        </div>
      )}
    </div>
  );
}
