"use client";

import { useEffect, useState } from "react";

import { EntryMedia } from "@/components/entry-media";
import { LiveLeaderboard } from "@/components/live-leaderboard";
import type { LeaderboardRow, VoteDeck } from "@/lib/server/types";

export function VoteClient({
  weekSlug,
  initialLeaderboard,
}: {
  weekSlug: string;
  initialLeaderboard: LeaderboardRow[];
}) {
  const [matchup, setMatchup] = useState<VoteDeck | null>(null);
  const [votesCompleted, setVotesCompleted] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  async function loadNextMatchup() {
    setIsLoading(true);
    setError(null);

    const response = await fetch(`/api/vote/next?week=${encodeURIComponent(weekSlug)}`);
    if (response.status === 404) {
      setMatchup(null);
      setIsFinished(true);
      setIsLoading(false);
      return;
    }

    const payload = (await response.json()) as VoteDeck & { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Failed to load a matchup.");
      setIsLoading(false);
      return;
    }

    setMatchup(payload);
    setIsLoading(false);
  }

  useEffect(() => {
    let isCancelled = false;

    async function hydrateMatchup() {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/vote/next?week=${encodeURIComponent(weekSlug)}`);
      if (response.status === 404) {
        if (isCancelled) {
          return;
        }

        setMatchup(null);
        setIsFinished(true);
        setIsLoading(false);
        return;
      }

      const payload = (await response.json()) as VoteDeck & { error?: string };

      if (isCancelled) {
        return;
      }

      if (!response.ok) {
        setError(payload.error ?? "Failed to load a matchup.");
        setIsLoading(false);
        return;
      }

      setMatchup(payload);
      setIsLoading(false);
    }

    void hydrateMatchup();

    return () => {
      isCancelled = true;
    };
  }, [weekSlug]);

  async function castVote(winnerEntryId: string, loserEntryId: string) {
    if (!matchup) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/vote", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        weekSlug,
        matchupId: matchup.matchupId,
        winnerEntryId,
        loserEntryId,
        idempotencyKey: crypto.randomUUID(),
      }),
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Vote failed.");
      setIsSubmitting(false);
      return;
    }

    const nextVoteCount = votesCompleted + 1;
    setVotesCompleted(nextVoteCount);
    setIsSubmitting(false);

    if (nextVoteCount >= 10) {
      setIsFinished(true);
      setMatchup(null);
      return;
    }

    void loadNextMatchup();
  }

  if (isFinished) {
    return (
      <div className="space-y-6">
        <div className="brutal-card p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-green)]">
            Voting sprint complete
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-[var(--ink)]">
            You cleared 10 head-to-head picks.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Share the round, send friends into the arena, and keep the leaderboard moving.
          </p>
          <a href="/leaderboard" className="brutal-btn brutal-btn-green mt-5">
            Open full leaderboard
          </a>
        </div>
        <LiveLeaderboard weekSlug={weekSlug} initialRows={initialLeaderboard} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="brutal-card flex items-center justify-between gap-4 px-5 py-4">
        <div>
          <p className="brutal-label">Signed-in voting streak</p>
          <p className="text-xl font-black tracking-tight text-[var(--ink)]">
            Vote {votesCompleted + 1} of 10
          </p>
        </div>
        <div className="border-[2px] border-[var(--ink)] bg-[var(--accent-green)] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink)]">
          ~2 min
        </div>
      </div>

      {isLoading ? (
        <div className="brutal-card p-8 text-base text-[var(--muted)]">
          Loading the next matchup...
        </div>
      ) : matchup ? (
        <div className="vote-grid">
          {[matchup.leftEntry, matchup.rightEntry].map((entry, index) => {
            const otherEntry = index === 0 ? matchup.rightEntry : matchup.leftEntry;
            const isLeft = index === 0;
            return (
              <article key={entry.id} className="brutal-card overflow-hidden">
                <EntryMedia assetPath={entry.demoAssetPath} title={entry.title} className="h-56 sm:h-72" />
                <div className="space-y-4 border-t-[3px] border-[var(--ink)] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="brutal-label">
                        {entry.foundingBuilder ? "Founding builder" : "Builder"}
                      </p>
                      <h2 className="mt-1 text-2xl font-black tracking-tight text-[var(--ink)]">
                        {entry.title}
                      </h2>
                    </div>
                    <span className="border-[2px] border-[var(--ink)] bg-[var(--bg)] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink)]">
                      {entry.builderName}
                    </span>
                  </div>
                  <p className="text-base leading-7 text-[var(--muted)]">{entry.oneLiner}</p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => castVote(entry.id, otherEntry.id)}
                      className={`brutal-btn ${isLeft ? "brutal-btn-green" : "brutal-btn-blue"} disabled:opacity-50`}
                    >
                      Pick this app
                    </button>
                    <a
                      href={entry.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="brutal-btn brutal-btn-outline"
                    >
                      Open app
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="brutal-card p-8 text-base text-[var(--muted)]">
          No fresh matchups are available right now.
        </div>
      )}

      {error ? (
        <p className="border-[2px] border-[var(--accent-red)] bg-red-50 px-4 py-3 font-mono text-sm font-bold text-[var(--accent-red)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
