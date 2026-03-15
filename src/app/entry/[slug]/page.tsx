import Link from "next/link";
import { notFound } from "next/navigation";

import { EntryMedia } from "@/components/entry-media";
import { getArenaService } from "@/lib/server/runtime";

export const dynamic = "force-dynamic";

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getArenaService().getEntryDetail(slug);

  if (!detail) {
    notFound();
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
            {detail.week.themeTitle}
          </p>
          <h1 className="text-4xl font-black uppercase tracking-[-0.06em] text-[var(--ink)]">
            {detail.entry.title}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--muted)]">
            {detail.entry.oneLiner}
          </p>
        </div>
        <EntryMedia assetPath={detail.entry.demoAssetPath} title={detail.entry.title} className="h-[26rem]" />
      </div>

      <aside className="space-y-5">
        <div className="rounded-[2rem] border border-[var(--line)] bg-white/86 p-6 shadow-[0_20px_60px_rgba(8,18,30,0.08)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
            Builder
          </p>
          <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-[var(--ink)]">
            {detail.builder.displayName}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">@{detail.builder.username}</p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--paper)] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
                Elo
              </p>
              <p className="mt-2 text-2xl font-black tracking-[-0.05em] text-[var(--ink)]">
                {detail.entry.eloRating}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--paper)] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
                Record
              </p>
              <p className="mt-2 text-2xl font-black tracking-[-0.05em] text-[var(--ink)]">
                {detail.entry.wins}-{detail.entry.losses}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={detail.entry.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--paper)] transition hover:bg-[var(--accent-blue)] hover:text-white"
            >
              Open app
            </a>
            <Link
              href="/vote"
              className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink)] transition hover:border-[var(--ink)] hover:bg-[var(--paper)]"
            >
              Vote now
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
