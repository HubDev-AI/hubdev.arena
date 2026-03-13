import Link from "next/link";

import { requireAdminSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";
import { EntryReviewList } from "@/components/admin/entry-review-list";
import { VoterStats } from "@/components/admin/voter-stats";
import { WeekOverrideControls } from "@/components/admin/week-override-controls";
import type { WeekStatus } from "@/lib/domain/weeks";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<WeekStatus, { bg: string; color: string; border: string }> = {
  draft: { bg: "#e5e5e5", color: "#333", border: "#000" },
  submissions_open: { bg: "#fbbf24", color: "#000", border: "#000" },
  voting_open: { bg: "#00FF41", color: "#000", border: "#000" },
  locked: { bg: "#fff", color: "#0033FF", border: "#0033FF" },
  archived: { bg: "#d4d4d4", color: "#666", border: "#999" },
};

export default async function AdminWeekDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdminSession("/admin/weeks");
  const { slug } = await params;
  const { tab = "overview" } = await searchParams;
  const service = getArenaService();
  const detail = await service.getWeekAdminDetail(slug);

  const approvedCount = detail.entries.filter((e) => e.status === "approved").length;
  const entriesWithBuilders = detail.entriesWithBuilders;

  const badgeStyle = STATUS_BADGE[detail.week.status];

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "entries", label: `Entries (${detail.entries.length})` },
    { key: "voters", label: "Voters" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/admin/weeks"
        className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)] hover:text-[var(--ink)]"
      >
        ← All Weeks
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black uppercase tracking-[-0.06em] text-[var(--ink)]">
              {detail.week.themeTitle}
            </h1>
            <span
              style={{
                display: "inline-block",
                background: badgeStyle.bg,
                color: badgeStyle.color,
                border: `2px solid ${badgeStyle.border}`,
                fontFamily: "Space Mono, monospace",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                padding: "4px 10px",
                borderRadius: 0,
                flexShrink: 0,
              }}
            >
              {detail.week.status.replaceAll("_", " ")}
            </span>
          </div>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
            {detail.week.slug}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="mt-8"
        style={{ borderBottom: "2px solid #000", display: "flex", gap: 0, marginBottom: "24px" }}
      >
        {tabs.map(({ key, label }) => (
          <Link
            key={key}
            href={`/admin/weeks/${slug}?tab=${key}`}
            style={{
              display: "block",
              padding: "10px 20px",
              fontFamily: "Space Mono, monospace",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: tab === key ? "#000" : "#888",
              textDecoration: "none",
              borderBottom: tab === key ? "3px solid #000" : "3px solid transparent",
              marginBottom: "-2px",
              background: "transparent",
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Overview tab */}
      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Week info */}
          <div className="rounded-[2rem] border border-[var(--line)] bg-white/86 p-6 shadow-[0_20px_60px_rgba(8,18,30,0.08)]">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
              Week Settings
            </p>
            <div className="mt-4 space-y-3">
              {[
                ["Theme Title", detail.week.themeTitle],
                ["Slug", detail.week.slug],
                ["Timezone", detail.week.timezone],
                ["Submission Open", detail.week.submissionOpenAt],
                ["Submission Close", detail.week.submissionCloseAt],
                ["Voting Open", detail.week.votingOpenAt],
                ["Voting Close", detail.week.votingCloseAt],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4 border-b border-[var(--line)] pb-3 last:border-0">
                  <span className="w-40 flex-shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    {label}
                  </span>
                  <span className="text-sm font-medium text-[var(--ink)]">{value}</span>
                </div>
              ))}
              <div className="flex gap-4 border-b border-[var(--line)] pb-3 last:border-0">
                <span className="w-40 flex-shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                  Description
                </span>
                <span className="text-sm leading-relaxed text-[var(--ink)]">
                  {detail.week.themeDescription}
                </span>
              </div>
            </div>
          </div>

          {/* Transition controls */}
          <div className="space-y-4 rounded-[2rem] border border-[var(--line)] bg-white/86 p-6 shadow-[0_20px_60px_rgba(8,18,30,0.08)]">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
              Status Controls
            </p>
            <WeekOverrideControls
              weekSlug={detail.week.slug}
              currentStatus={detail.week.status}
              approvedEntryCount={approvedCount}
            />
            {detail.week.status === "archived" && (
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
                This week is archived.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Entries tab */}
      {tab === "entries" && (
        <div className="rounded-[2rem] border border-[var(--line)] bg-white/84 p-6 shadow-[0_20px_60px_rgba(8,18,30,0.08)]">
          <EntryReviewList entries={entriesWithBuilders} weekSlug={detail.week.slug} />
        </div>
      )}

      {/* Voters tab */}
      {tab === "voters" && (
        <div className="rounded-[2rem] border border-[var(--line)] bg-white/84 p-6 shadow-[0_20px_60px_rgba(8,18,30,0.08)]">
          <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
            Voter Metrics
          </p>
          <VoterStats voterSessions={detail.voterSessions} votes={detail.votes} />

          <div className="mt-8 border-t border-[var(--line)] pt-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
              Matchups Generated
            </p>
            <p className="mt-2 text-3xl font-black uppercase tracking-[-0.05em] text-[var(--ink)]">
              {detail.matchups.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
