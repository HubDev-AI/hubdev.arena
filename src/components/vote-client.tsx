"use client";

import { useEffect, useState } from "react";

import { EntryMedia } from "@/components/entry-media";
import { InfoTooltip } from "@/components/info-tooltip";
import { LiveLeaderboard } from "@/components/live-leaderboard";
import { safeHref } from "@/lib/safe-href";
import type { LeaderboardRow, VoteDeck } from "@/lib/server/types";

async function fetchMatchup(
  weekSlug: string,
  signal?: AbortSignal,
): Promise<
  | { kind: "finished" }
  | { kind: "error"; message: string }
  | { kind: "ok"; deck: VoteDeck }
> {
  try {
    const response = await fetch(
      `/api/vote/next?week=${encodeURIComponent(weekSlug)}`,
      {
        signal,
        headers: { "X-Requested-With": "XMLHttpRequest" },
      },
    );

    if (response.status === 404) {
      return { kind: "finished" };
    }

    const payload = (await response.json()) as VoteDeck & { error?: string };

    if (!response.ok) {
      return { kind: "error", message: payload.error ?? "Failed to load a matchup." };
    }

    return { kind: "ok", deck: payload };
  } catch {
    return { kind: "error", message: "Network error. Please check your connection and try again." };
  }
}

export function VoteClient({
  weekSlug,
  weekId,
  initialLeaderboard,
}: {
  weekSlug: string;
  weekId?: string;
  initialLeaderboard: LeaderboardRow[];
}) {
  const [matchup, setMatchup] = useState<VoteDeck | null>(null);
  const [votesCompleted, setVotesCompleted] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [showVoteSuccess, setShowVoteSuccess] = useState(false);

  async function loadNextMatchup() {
    setIsLoading(true);
    setError(null);

    const result = await fetchMatchup(weekSlug);

    if (result.kind === "finished") {
      setMatchup(null);
      setIsFinished(true);
      setIsLoading(false);
      return;
    }

    if (result.kind === "error") {
      setError(result.message);
      setIsLoading(false);
      return;
    }

    setMatchup(result.deck);
    setIsLoading(false);
  }

  useEffect(() => {
    const controller = new AbortController();

    async function hydrateMatchup() {
      setIsLoading(true);
      setError(null);

      const result = await fetchMatchup(weekSlug, controller.signal);

      if (controller.signal.aborted) return;

      if (result.kind === "finished") {
        setMatchup(null);
        setIsFinished(true);
        setIsLoading(false);
        return;
      }

      if (result.kind === "error") {
        setError(result.message);
        setIsLoading(false);
        return;
      }

      setMatchup(result.deck);
      setIsLoading(false);
    }

    void hydrateMatchup();

    return () => {
      controller.abort();
    };
  }, [weekSlug]);

  async function castVote(winnerEntryId: string, loserEntryId: string) {
    if (!matchup) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
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
    } catch {
      setError("Network error. Please check your connection and try again.");
      setIsSubmitting(false);
      return;
    }

    const nextVoteCount = votesCompleted + 1;
    setVotesCompleted(nextVoteCount);
    setIsSubmitting(false);

    setShowVoteSuccess(true);
    setTimeout(() => setShowVoteSuccess(false), 600);

    if (nextVoteCount >= 10) {
      setIsFinished(true);
      setMatchup(null);
      return;
    }

    void loadNextMatchup();
  }

  if (isFinished) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="brutal-card relative overflow-hidden bg-[var(--ink)] p-8 text-white">
          <div className="absolute right-0 top-0 h-16 w-16 bg-[var(--accent-green)]" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
          <div className="absolute bottom-0 left-0 h-1.5 w-full bg-[var(--accent-green)]" />
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-green)]">
            Voting sprint complete
          </p>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-6xl font-black text-[var(--accent-green)] sm:text-7xl">{votesCompleted}</span>
            <span className="text-2xl font-black sm:text-3xl">votes cast</span>
          </div>
          <p className="mt-3 max-w-2xl text-base leading-7 text-gray-400">
            Share the round, send friends into the arena, and keep the leaderboard moving.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/leaderboard" className="brutal-btn brutal-btn-green">
              Open full leaderboard
            </a>
            <button
              type="button"
              onClick={() => { setIsFinished(false); setVotesCompleted(0); void loadNextMatchup(); }}
              className="brutal-btn bg-white text-[var(--ink)]"
            >
              Vote 10 more
            </button>
          </div>
        </div>
        <LiveLeaderboard weekSlug={weekSlug} weekId={weekId} initialRows={initialLeaderboard} />
      </div>
    );
  }

  return (
    <div className="relative space-y-5">
      {/* Vote success toast */}
      {showVoteSuccess ? (
        <div className="absolute left-1/2 top-0 z-50 -translate-x-1/2 -translate-y-full animate-slide-up">
          <div className="brutal-badge brutal-badge-green px-4 py-2 text-xs shadow-[var(--shadow-sm)]">
            Vote recorded
          </div>
        </div>
      ) : null}

      {/* Error alert — placed above matchup cards for visibility */}
      {error ? (
        <div className="brutal-card overflow-hidden border-[var(--accent-red)] p-0" role="alert">
          <div className="h-1 w-full bg-[var(--accent-red)]" />
          <p className="px-5 py-4 font-mono text-sm font-bold text-[var(--accent-red)]">
            {error}
          </p>
        </div>
      ) : null}

      {/* Progress bar */}
      <div className="brutal-card overflow-hidden p-0">
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div>
            <InfoTooltip tip="Each voting session consists of 10 matchups. Pick the app you think is better in each head-to-head pairing.">
              <p className="brutal-label">Signed-in voting streak</p>
            </InfoTooltip>
            <p className="text-xl font-black tracking-tight text-[var(--ink)]">
              Vote {votesCompleted + 1} of 10
            </p>
          </div>
          <div className="brutal-badge brutal-badge-green">
            ~2 min
          </div>
        </div>
        {/* Visual progress */}
        <div className="h-1.5 w-full bg-[var(--bg)]">
          <div
            className="h-full bg-[var(--accent-green)] transition-all duration-500"
            style={{ width: `${((votesCompleted) / 10) * 100}%` }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="vote-grid">
          {[0, 1].map((i) => (
            <div key={i} className="brutal-card overflow-hidden">
              <div className="h-56 animate-pulse bg-[var(--ink)]/10 sm:h-72" />
              <div className="space-y-4 border-t-[3px] border-[var(--ink)] p-5">
                <div className="h-4 w-24 animate-pulse bg-[var(--ink)]/10" />
                <div className="h-8 w-48 animate-pulse bg-[var(--ink)]/10" />
                <div className="h-4 w-full animate-pulse bg-[var(--ink)]/10" />
                <div className="h-10 w-32 animate-pulse bg-[var(--ink)]/10" />
              </div>
            </div>
          ))}
        </div>
      ) : matchup ? (
        <div className="vote-grid relative">
          <div className="vs-badge">VS</div>
          {[matchup.leftEntry, matchup.rightEntry].map((entry, index) => {
            const otherEntry = index === 0 ? matchup.rightEntry : matchup.leftEntry;
            const isLeft = index === 0;
            return (
              <article key={entry.id} className={`brutal-card overflow-hidden ${isLeft ? "vote-enter-left" : "vote-enter-right"}`}>
                <div className={`h-1.5 w-full ${isLeft ? "bg-[var(--accent-green)]" : "bg-[var(--accent-blue)]"}`} />
                <div className="img-zoom">
                  <EntryMedia assetPath={entry.demoAssetPath} title={entry.title} className="h-56 sm:h-72" />
                </div>
                <div className="space-y-4 border-t-[3px] border-[var(--ink)] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <InfoTooltip tip={entry.foundingBuilder ? "Founding builder — one of the original members of the HubDev Arena community." : "Builder — the developer who created and submitted this entry."}>
                        <p className="brutal-label">
                          {entry.foundingBuilder ? "Founding builder" : "Builder"}
                        </p>
                      </InfoTooltip>
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
                      className={`brutal-btn px-6 py-4 text-sm ${isLeft ? "brutal-btn-green" : "brutal-btn-blue"} disabled:opacity-50`}
                    >
                      Pick this app
                    </button>
                    <a
                      href={safeHref(entry.liveUrl)}
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
        <div className="brutal-card p-8 text-center">
          <p className="text-lg font-black text-[var(--ink)]">No fresh matchups right now</p>
          <p className="mt-2 text-sm text-[var(--muted)]">All available pairs have been voted on. Check back later or view the leaderboard.</p>
          <a href="/leaderboard" className="brutal-btn brutal-btn-outline mt-4">
            View leaderboard
          </a>
        </div>
      )}
    </div>
  );
}
