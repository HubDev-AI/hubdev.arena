"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { EntryMedia } from "@/components/entry-media";
import { InfoTooltip } from "@/components/info-tooltip";
import { LiveLeaderboard } from "@/components/live-leaderboard";
import { ProgressRing } from "@/components/progress-ring";
import { safeHref } from "@/lib/safe-href";
import type { LeaderboardRow, VoteDeck } from "@/lib/server/types";

async function fetchMatchup(
  weekSlug: string,
  signal?: AbortSignal,
): Promise<
  | { kind: "finished" }
  | { kind: "error"; message: string }
  | { kind: "rate_limited"; message: string }
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

    if (response.status === 429) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      return {
        kind: "rate_limited",
        message: payload.error ?? "You've reached the voting limit. Try again in a few minutes.",
      };
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
  const [votesCompleted, setVotesCompleted] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [showVoteSuccess, setShowVoteSuccess] = useState(false);
  const [highlightWinner, setHighlightWinner] = useState<string | null>(null);
  const [crossfadeReady, setCrossfadeReady] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const errorRef = useRef<HTMLDivElement>(null);
  const completionRef = useRef<HTMLHeadingElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // C4: Initialize votesCompleted from server data
  const initVotesFromDeck = useCallback((deck: VoteDeck) => {
    setVotesCompleted((prev) => (prev === null ? deck.votesCast : prev));
  }, []);

  // M9: Focus management
  useEffect(() => {
    if (error || rateLimitMessage) {
      errorRef.current?.focus();
    }
  }, [error, rateLimitMessage]);

  useEffect(() => {
    if (isFinished) {
      completionRef.current?.focus();
    }
  }, [isFinished]);

  useEffect(() => {
    if (!isLoading && matchup && !isFirstLoad) {
      // Small delay so DOM is rendered
      const t = setTimeout(() => firstButtonRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isLoading, matchup, isFirstLoad]);

  async function loadNextMatchup(opts?: { crossfade?: boolean }) {
    if (opts?.crossfade) {
      setCrossfadeReady(false);
    }
    setIsLoading(true);
    setError(null);
    setRateLimitMessage(null);

    const result = await fetchMatchup(weekSlug);

    if (result.kind === "finished") {
      setMatchup(null);
      setIsFinished(true);
      setIsLoading(false);
      return;
    }

    if (result.kind === "rate_limited") {
      setRateLimitMessage(result.message);
      setIsLoading(false);
      return;
    }

    if (result.kind === "error") {
      setError(result.message);
      setIsLoading(false);
      return;
    }

    initVotesFromDeck(result.deck);
    setMatchup(result.deck);
    setIsLoading(false);
    setIsFirstLoad(false);

    if (opts?.crossfade) {
      // Brief delay then reveal via crossfade
      requestAnimationFrame(() => setCrossfadeReady(true));
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    async function hydrateMatchup() {
      setIsLoading(true);
      setError(null);
      setRateLimitMessage(null);

      const result = await fetchMatchup(weekSlug, controller.signal);

      if (controller.signal.aborted) return;

      if (result.kind === "finished") {
        setMatchup(null);
        setIsFinished(true);
        setIsLoading(false);
        return;
      }

      if (result.kind === "rate_limited") {
        setRateLimitMessage(result.message);
        setIsLoading(false);
        return;
      }

      if (result.kind === "error") {
        setError(result.message);
        setIsLoading(false);
        return;
      }

      // C4: Initialize votesCompleted from server votesCast
      setVotesCompleted(result.deck.votesCast);
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
    setRateLimitMessage(null);

    const currentMatchupId = matchup.matchupId;
    const idempotencyKey = crypto.randomUUID();

    async function attemptVote(key: string): Promise<{ ok: boolean; status: number; payload: { error?: string } }> {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          weekSlug,
          matchupId: currentMatchupId,
          winnerEntryId,
          loserEntryId,
          idempotencyKey: key,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      return { ok: response.ok, status: response.status, payload };
    }

    try {
      let result = await attemptVote(idempotencyKey);

      // H7: Auto-retry idempotency key conflicts with a new key
      if (
        !result.ok &&
        result.payload.error &&
        /idempotency/i.test(result.payload.error)
      ) {
        result = await attemptVote(crypto.randomUUID());
      }

      // C5: Specific rate-limit UI for 429
      if (result.status === 429) {
        setRateLimitMessage(
          result.payload.error ?? "You've reached the voting limit. Try again in a few minutes.",
        );
        setIsSubmitting(false);
        return;
      }

      if (!result.ok) {
        setError(result.payload.error ?? "Vote failed.");
        setIsSubmitting(false);
        return;
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
      setIsSubmitting(false);
      return;
    }

    const currentVotes = votesCompleted ?? 0;
    const nextVoteCount = currentVotes + 1;
    setVotesCompleted(nextVoteCount);
    setIsSubmitting(false);

    // H2: Highlight winning card before transition
    setHighlightWinner(winnerEntryId);

    // H1: Show success toast for 1500ms
    setShowVoteSuccess(true);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setShowVoteSuccess(false), 1500);

    if (nextVoteCount >= 10) {
      // Wait for highlight to show before finishing
      setTimeout(() => {
        setHighlightWinner(null);
        setIsFinished(true);
        setMatchup(null);
      }, 800);
      return;
    }

    // H2: Wait 800ms for highlight, then load next with crossfade (M10)
    setTimeout(() => {
      setHighlightWinner(null);
      void loadNextMatchup({ crossfade: true });
    }, 800);
  }

  // H4: Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't fire if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (!matchup || isSubmitting || isLoading || isFinished) return;

      if (e.key === "ArrowLeft" || e.key === "1") {
        e.preventDefault();
        void castVote(matchup.leftEntry.id, matchup.rightEntry.id);
      } else if (e.key === "ArrowRight" || e.key === "2") {
        e.preventDefault();
        void castVote(matchup.rightEntry.id, matchup.leftEntry.id);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- castVote is stable within each matchup/isSubmitting/isLoading/isFinished combination
  }, [matchup, isSubmitting, isLoading, isFinished]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const safeVotesCompleted = votesCompleted ?? 0;

  // C5: Rate limit UI — shown as a distinct state
  if (rateLimitMessage && !isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div
          ref={errorRef}
          tabIndex={-1}
          className="brutal-card relative overflow-hidden border-[var(--accent-red)] bg-[var(--ink)] p-8 text-white neon-box"
          role="alert"
          aria-live="assertive"
        >
          <div className="h-1.5 w-full bg-[var(--accent-red)] absolute top-0 left-0" />
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-red)] mt-2">
            Rate limit reached
          </p>
          <p className="mt-4 text-xl font-black text-white">
            {rateLimitMessage}
          </p>
          <p className="mt-3 max-w-2xl text-base leading-7 text-gray-400">
            Take a break and come back shortly. Your votes have been saved.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/leaderboard" className="brutal-btn brutal-btn-outline hover-lift">
              View leaderboard
            </a>
            <button
              type="button"
              onClick={() => {
                setRateLimitMessage(null);
                void loadNextMatchup();
              }}
              className="brutal-btn brutal-btn-outline hover-lift"
            >
              Try again
            </button>
          </div>
        </div>
        <LiveLeaderboard weekSlug={weekSlug} weekId={weekId} initialRows={initialLeaderboard} />
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="brutal-card relative overflow-hidden bg-[var(--ink)] p-8 text-white neon-box scanlines">
          <div className="absolute right-0 top-0 h-16 w-16 bg-[var(--accent-green)]" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
          <div className="absolute bottom-0 left-0 h-1.5 w-full bg-[var(--accent-green)]" style={{ boxShadow: "0 0 20px rgba(0, 255, 65, 0.4)" }} />
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-green)] neon-text">
            Voting sprint complete
          </p>
          <div className="mt-4 flex items-baseline gap-3">
            {/* C4/H5: Uses safeVotesCompleted which persists from server data */}
            <span
              ref={completionRef}
              tabIndex={-1}
              className="text-6xl font-black text-[var(--accent-green)] sm:text-7xl"
              style={{ textShadow: "0 0 30px rgba(0, 255, 65, 0.4), 0 0 60px rgba(0, 255, 65, 0.15)" }}
            >
              {safeVotesCompleted}
            </span>
            <span className="text-2xl font-black sm:text-3xl">votes cast</span>
          </div>
          <p className="mt-3 max-w-2xl text-base leading-7 text-gray-400">
            Share the round, send friends into the arena, and keep the leaderboard moving.
          </p>
          {/* L3: Swapped CTA hierarchy — "Vote 10 more" is primary, leaderboard is secondary */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                // H6: Fetch next matchup first — if 429, show rate limit UI
                setIsFinished(false);
                void loadNextMatchup();
              }}
              className="brutal-btn brutal-btn-green hover-lift"
            >
              Vote 10 more
            </button>
            <a href="/leaderboard" className="brutal-btn brutal-btn-outline hover-lift">
              Open full leaderboard
            </a>
          </div>
        </div>
        <LiveLeaderboard weekSlug={weekSlug} weekId={weekId} initialRows={initialLeaderboard} />
      </div>
    );
  }

  return (
    <div className="relative space-y-5">
      {/* H1: Success toast — fixed bottom position, 1500ms display, accessible */}
      {showVoteSuccess ? (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <div className="brutal-badge brutal-badge-green px-4 py-2 text-xs neon-text" style={{ boxShadow: "var(--shadow-sm), 0 0 20px rgba(0, 255, 65, 0.3)" }}>
            Vote recorded
          </div>
        </div>
      ) : null}

      {/* Error alert — placed above matchup cards for visibility */}
      {error ? (
        <div
          ref={errorRef}
          tabIndex={-1}
          className="brutal-card overflow-hidden border-[var(--accent-red)] p-0"
          role="alert"
        >
          <div className="h-1 w-full bg-[var(--accent-red)]" />
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <p className="font-mono text-sm font-bold text-[var(--accent-red)]">
              {error}
            </p>
            {/* M3: Try again button on error banner */}
            <button
              type="button"
              onClick={() => {
                setError(null);
                void loadNextMatchup();
              }}
              className="brutal-btn brutal-btn-outline px-3 py-1.5 text-xs whitespace-nowrap"
            >
              Try again
            </button>
          </div>
        </div>
      ) : null}

      {/* Progress bar */}
      <div className="brutal-card overflow-hidden p-0 neon-box">
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div>
            {/* L2: Changed label text */}
            <InfoTooltip tip="Each voting session consists of 10 matchups. Pick the app you think is better in each head-to-head pairing.">
              <p className="brutal-label">Voting session progress</p>
            </InfoTooltip>
            <p className="text-xl font-black tracking-tight text-[var(--text-primary)]">
              Vote {safeVotesCompleted + 1} of 10
            </p>
          </div>
          <div className="relative flex items-center justify-center">
            <ProgressRing progress={(safeVotesCompleted / 10) * 100} size={48} />
            <span className="absolute font-mono text-[10px] font-bold text-[var(--accent-green)]">
              {safeVotesCompleted}/10
            </span>
          </div>
        </div>
        {/* Visual progress */}
        <div className="h-2 w-full bg-[var(--bg)]">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${((safeVotesCompleted) / 10) * 100}%`,
              background: "linear-gradient(90deg, var(--accent-green), var(--accent-blue))",
              boxShadow: "0 0 10px rgba(0, 255, 65, 0.3)",
            }}
          />
        </div>
      </div>

      {isLoading && isFirstLoad ? (
        <div className="vote-grid">
          {[0, 1].map((i) => (
            <div key={i} className={`brutal-card overflow-hidden ${i === 0 ? "border-t-[3px] border-t-[var(--accent-green)]" : "border-t-[3px] border-t-[var(--accent-blue)]"}`}>
              <div className="h-56 skeleton-shimmer sm:h-72" />
              <div className="space-y-4 border-t-[3px] border-[var(--line)] p-5">
                <div className="h-4 w-24 skeleton-shimmer" />
                <div className="h-8 w-48 skeleton-shimmer" />
                <div className="h-4 w-full skeleton-shimmer" />
                <div className="h-10 w-32 skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : matchup ? (
        /* M10: Crossfade transition for subsequent loads */
        <div
          className={`vote-grid relative transition-opacity duration-300 ${
            isLoading && !isFirstLoad ? "opacity-0" : crossfadeReady || isFirstLoad ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="vs-badge">VS</div>
          {[matchup.leftEntry, matchup.rightEntry].map((entry, index) => {
            const otherEntry = index === 0 ? matchup.rightEntry : matchup.leftEntry;
            const isLeft = index === 0;
            const isHighlighted = highlightWinner === entry.id;
            return (
              <article
                key={entry.id}
                className={`brutal-card overflow-hidden hover-lift holo-shimmer ${
                  isLeft
                    ? "vote-enter-left border-t-[3px] border-t-[var(--accent-green)]"
                    : "vote-enter-right border-t-[3px] border-t-[var(--accent-blue)]"
                } ${isHighlighted ? "ring-4 ring-emerald-400" : ""}`}
                style={
                  isHighlighted
                    ? { boxShadow: "0 0 30px rgba(52, 211, 153, 0.5), 0 0 60px rgba(52, 211, 153, 0.2)", transition: "box-shadow 0.3s, ring 0.3s" }
                    : undefined
                }
              >
                <div className="img-zoom">
                  <EntryMedia assetPath={entry.demoAssetPath} title={entry.title} className="h-56 sm:h-72" />
                </div>
                <div className="space-y-4 border-t-[3px] border-[var(--line)] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <InfoTooltip tip={entry.foundingBuilder ? "Founding builder — one of the original members of the HubDev Arena community." : "Builder — the developer who created and submitted this entry."}>
                        <p className="brutal-label">
                          {entry.foundingBuilder ? "Founding builder" : "Builder"}
                        </p>
                      </InfoTooltip>
                      <h2 className="mt-1 text-2xl font-black tracking-tight text-[var(--text-primary)] animated-underline">
                        {entry.title}
                      </h2>
                    </div>
                    <span className="border-[2px] border-[var(--line)] bg-[var(--bg)] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      {entry.builderName}
                    </span>
                  </div>
                  <p className="text-base leading-7 text-[var(--text-secondary)]">{entry.oneLiner}</p>
                  <div className="flex flex-wrap gap-3">
                    {/* H3: Unique aria-label per entry; H4: Keyboard shortcut hints */}
                    <button
                      ref={isLeft ? firstButtonRef : undefined}
                      type="button"
                      disabled={isSubmitting || highlightWinner !== null}
                      onClick={() => castVote(entry.id, otherEntry.id)}
                      aria-label={`Pick ${entry.title}`}
                      className={`brutal-btn px-6 py-4 text-sm hover-lift ${isLeft ? "brutal-btn-green" : "brutal-btn-blue"} disabled:opacity-50`}
                      style={isLeft ? { boxShadow: "var(--shadow-sm), 0 0 15px rgba(0, 255, 65, 0.15)" } : { boxShadow: "var(--shadow-sm), 0 0 15px rgba(0, 51, 255, 0.15)" }}
                    >
                      Pick this app{" "}
                      <span className="ml-1 opacity-50 text-[10px] font-mono">
                        {isLeft ? "(\u2190 1)" : "(\u2192 2)"}
                      </span>
                    </button>
                    {/* M5: External link icon and accessible label */}
                    <a
                      href={safeHref(entry.liveUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="brutal-btn brutal-btn-outline hover-lift"
                      aria-label={`Open ${entry.title} (opens in new tab)`}
                    >
                      Open app{" "}
                      <span className="ml-1 inline-block" aria-hidden="true">{"\u2197"}</span>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}

          {/* M2: Skip button below VS badge */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-20 sm:bottom-auto sm:top-[60%]">
            <button
              type="button"
              disabled={isSubmitting || highlightWinner !== null}
              onClick={() => void loadNextMatchup({ crossfade: true })}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono text-xs uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity disabled:opacity-30"
              aria-label="Skip this matchup"
            >
              Skip
            </button>
          </div>
        </div>
      ) : (
        <div className="brutal-card p-8 text-center neon-box">
          <p className="text-lg font-black text-[var(--text-primary)] neon-text">No fresh matchups right now</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">All available pairs have been voted on. Check back later or view the leaderboard.</p>
          <a href="/leaderboard" className="brutal-btn brutal-btn-outline mt-4">
            View leaderboard
          </a>
        </div>
      )}
    </div>
  );
}
