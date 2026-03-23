"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { ActionResult } from "@/app/admin/actions";
import { reviewEntryAction } from "@/app/admin/actions";
import type { WeekStatus } from "@/lib/domain/weeks";

type EntryData = {
  id: string;
  title: string;
  oneLiner: string;
  liveUrl: string;
  status: "pending" | "approved" | "rejected";
  rejectionNote: string | null;
  builderName: string | null;
  builderId: string;
};

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function ReviewButton({ decision, label, className }: { decision: string; label: string; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="decision"
      value={decision}
      disabled={pending}
      className={`${className} disabled:opacity-50`}
    >
      {pending ? "..." : label}
    </button>
  );
}

function EntryCard({
  entry,
  weekSlug,
  weekStatus,
}: {
  entry: EntryData;
  weekSlug: string;
  weekStatus: WeekStatus;
}) {
  const [state, formAction] = useActionState(reviewEntryAction, { success: true });

  const entryColor =
    entry.status === "approved"
      ? "var(--accent-green)"
      : entry.status === "pending"
        ? "var(--accent-yellow)"
        : "var(--accent-red)";

  // L37: Check if URL is valid/truthy
  const hasValidUrl = Boolean(entry.liveUrl) && entry.liveUrl !== "#";
  let isUrlValid = false;
  if (hasValidUrl) {
    try {
      const parsed = new URL(entry.liveUrl);
      isUrlValid = parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      isUrlValid = false;
    }
  }

  return (
    <div className="relative p-5 pl-7">
      <div className="absolute left-0 top-0 h-full w-1.5" style={{ background: entryColor }} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-black tracking-tight text-[var(--text-primary)]">
            {entry.title}
          </p>
          {/* L36: Show builder name */}
          <p className="mt-0.5 font-mono text-[11px] text-[var(--text-secondary)]">
            by {entry.builderName ?? entry.builderId.slice(0, 8)}
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {entry.oneLiner}
          </p>
          {/* L36: Show rejection note for rejected entries */}
          {entry.status === "rejected" && entry.rejectionNote ? (
            <p className="mt-1 font-mono text-[10px] text-red-400">
              Rejection note: {entry.rejectionNote}
            </p>
          ) : null}
        </div>
        <span
          className="inline-block rounded-sm border-[2px] border-[var(--line)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase"
          style={{ background: entryColor, color: "var(--bg)" }}
        >
          {entry.status}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {/* L37: Disable/hide invalid URLs */}
        {isUrlValid ? (
          <a
            href={entry.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="brutal-btn brutal-btn-outline text-[10px] px-3 py-1.5"
          >
            Open app
          </a>
        ) : (
          <span className="inline-flex items-center px-3 py-1.5 font-mono text-[10px] text-[var(--text-secondary)] opacity-60">
            No URL provided
          </span>
        )}
        {weekStatus === "submissions_open" ? (
          <form action={formAction} className="flex gap-2">
            <input type="hidden" name="weekSlug" value={weekSlug} />
            <input type="hidden" name="entryId" value={entry.id} />
            <ReviewButton
              decision="approved"
              label="Approve"
              className="brutal-btn brutal-btn-green text-[10px] px-3 py-1.5"
            />
            <ReviewButton
              decision="rejected"
              label="Reject"
              className="brutal-btn brutal-btn-outline text-[10px] px-3 py-1.5 !border-[var(--accent-red)] !text-[var(--accent-red)]"
            />
          </form>
        ) : null}
      </div>
      {/* H16: Show error banner when review action fails */}
      {!state.success && state.error ? (
        <div className="mt-2 border-t-[2px] border-[var(--accent-red)] bg-red-900/20 px-3 py-2">
          <p className="font-mono text-[10px] font-bold text-red-400">{state.error}</p>
        </div>
      ) : null}
    </div>
  );
}

export function EntryModeration({
  entries,
  weekSlug,
  weekStatus,
}: {
  entries: EntryData[];
  weekSlug: string;
  weekStatus: WeekStatus;
}) {
  // M20: Status filter
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filteredEntries =
    filter === "all" ? entries : entries.filter((e) => e.status === filter);

  return (
    <section className="brutal-card overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-black/40 px-5 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
          Entry moderation
        </p>
        <span className="brutal-badge brutal-badge-green">
          {entries.length} total
        </span>
      </div>

      {/* M20: Filter buttons */}
      <div className="flex flex-wrap gap-2 border-b-[2px] border-[var(--line)] px-5 py-3">
        {FILTER_OPTIONS.map((option) => {
          const count =
            option.value === "all"
              ? entries.length
              : entries.filter((e) => e.status === option.value).length;
          const isActive = filter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 border-[2px] transition ${
                isActive
                  ? "border-[var(--accent-green)] bg-emerald-900/20 text-[var(--accent-green)]"
                  : "border-[var(--line)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
              }`}
            >
              {option.label} ({count})
            </button>
          );
        })}
      </div>

      {filteredEntries.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            {entries.length === 0
              ? "No entries submitted yet."
              : `No ${filter} entries.`}
          </p>
        </div>
      ) : (
        <div className="divide-y-[2px] divide-[var(--line)]">
          {filteredEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              weekSlug={weekSlug}
              weekStatus={weekStatus}
            />
          ))}
        </div>
      )}
    </section>
  );
}
