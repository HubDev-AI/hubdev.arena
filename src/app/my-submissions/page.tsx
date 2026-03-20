import { requireBuilderSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

export const dynamic = "force-dynamic";

export default async function MySubmissionsPage() {
  const session = await requireBuilderSession("/my-submissions");
  const groups = await getArenaService().getMySubmissions(session.userId);

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
        <div className="space-y-5">
          {groups.map((group) => (
            <section
              key={group.week.id}
              className="rounded-[2rem] border border-[var(--line)] bg-white/84 p-6 shadow-[0_20px_60px_rgba(8,18,30,0.08)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
                    {group.week.status.replaceAll("_", " ")}
                  </p>
                  <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em] text-[var(--ink)]">
                    {group.week.themeTitle}
                  </h2>
                </div>
                <span className="rounded-full bg-[var(--acid)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--ink)]">
                  {group.week.slug}
                </span>
              </div>
              <div className="mt-6 grid gap-4">
                {group.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper)] px-5 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xl font-black tracking-[-0.04em] text-[var(--ink)]">
                          {entry.title}
                        </p>
                        <p className="mt-2 text-sm text-[var(--muted)]">{entry.oneLiner}</p>
                      </div>
                      <span className="rounded-full bg-[var(--acid)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--ink)]">
                        {entry.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-[var(--line)] bg-white/84 p-6 shadow-[0_20px_60px_rgba(8,18,30,0.08)]">
          <p className="text-base leading-7 text-[var(--muted)]">
            You have not submitted an entry yet.
          </p>
        </div>
      )}
    </div>
  );
}
