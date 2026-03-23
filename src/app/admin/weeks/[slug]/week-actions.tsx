"use client";

import Link from "next/link";

import type { WeekStatus } from "@/lib/domain/weeks";
import {
  openSubmissionsAction,
  openVotingAction,
  lockWeekAction,
  archiveWeekAction,
} from "@/app/admin/actions";

import { ConfirmForm } from "./confirm-form";

export function WeekActions({
  weekSlug,
  weekStatus,
  approvedCount,
  statusColor,
}: {
  weekSlug: string;
  weekStatus: WeekStatus;
  approvedCount: number;
  statusColor: string;
}) {
  const needsMoreEntries = approvedCount < 2;

  return (
    <div className="brutal-card overflow-hidden p-0 border-l-[4px]" style={{ borderLeftColor: statusColor }}>
      <div className="bg-black/40 px-5 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">Week actions</p>
      </div>
      <div className="flex flex-wrap gap-3 p-5 items-start">
        {/* H12: Open submissions wrapped in ConfirmForm */}
        {weekStatus === "draft" ? (
          <ConfirmForm
            action={openSubmissionsAction}
            confirmMessage="This will open the week for submissions."
            hiddenFields={{ weekSlug }}
            buttonLabel="Open submissions"
            buttonClassName="brutal-btn brutal-btn-green hover-lift"
          />
        ) : null}

        {/* H12: Open voting wrapped in ConfirmForm + M21: minimum entry check */}
        {weekStatus === "submissions_open" ? (
          needsMoreEntries ? (
            <div className="relative group">
              <button
                type="button"
                disabled
                className="brutal-btn brutal-btn-green hover-lift opacity-50 cursor-not-allowed"
                aria-describedby="min-entries-tooltip"
              >
                Generate matchups + open voting
              </button>
              <div
                id="min-entries-tooltip"
                role="tooltip"
                className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 border-[2px] border-[var(--accent-yellow)] font-mono text-[10px] text-[var(--accent-yellow)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30"
              >
                Need at least 2 approved entries
              </div>
            </div>
          ) : (
            <ConfirmForm
              action={openVotingAction}
              confirmMessage="This will generate matchups and open voting. Existing matchup data will be replaced."
              hiddenFields={{ weekSlug }}
              buttonLabel="Generate matchups + open voting"
              buttonClassName="brutal-btn brutal-btn-green hover-lift"
            />
          )
        ) : null}

        {weekStatus === "voting_open" ? (
          <ConfirmForm
            action={lockWeekAction}
            confirmMessage="Are you sure you want to lock results? This action cannot be undone."
            hiddenFields={{ weekSlug }}
            buttonLabel="Lock results"
            buttonClassName="brutal-btn brutal-btn-blue hover-lift"
          />
        ) : null}

        {weekStatus === "locked" ? (
          <ConfirmForm
            action={archiveWeekAction}
            confirmMessage="Are you sure you want to archive this week? This action cannot be undone."
            hiddenFields={{ weekSlug }}
            buttonLabel="Archive week"
            buttonClassName="brutal-btn brutal-btn-outline hover-lift"
          />
        ) : null}

        <Link href="/admin/weeks" className="brutal-btn brutal-btn-outline">
          Back to weeks
        </Link>
      </div>
    </div>
  );
}
