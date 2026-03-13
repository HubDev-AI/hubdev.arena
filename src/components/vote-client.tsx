"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AuthGateModal } from "@/components/auth-gate-modal";
import { EntryMedia } from "@/components/entry-media";
import { VoterProgress } from "@/components/voter-progress";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { LeaderboardRow, VoteDeck, VoteDeckEntry } from "@/lib/server/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VoteIntent = {
  matchupId: string;
  winnerEntryId: string;
  loserEntryId: string;
  idempotencyKey: string;
};

type VotingState =
  | { phase: "loading" }
  | { phase: "matchup"; matchup: VoteDeck }
  | { phase: "auth-gate"; matchup: VoteDeck; intent: VoteIntent }
  | { phase: "submitting"; matchup: VoteDeck; intent: VoteIntent }
  | { phase: "post-10"; leaderboard: LeaderboardRow[] }
  | { phase: "all-seen" }
  | { phase: "closed" }
  | { phase: "error"; message: string };

// ---------------------------------------------------------------------------
// Helper: is the voter currently signed in?
// ---------------------------------------------------------------------------

async function getIsSignedIn(): Promise<boolean> {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session !== null;
}

// ---------------------------------------------------------------------------
// VoteClient
// ---------------------------------------------------------------------------

export function VoteClient({
  weekSlug,
  initialLeaderboard,
}: {
  weekSlug: string;
  initialLeaderboard: LeaderboardRow[];
}) {
  const [state, setState] = useState<VotingState>({ phase: "loading" });
  const [votesCast, setVotesCast] = useState(0);
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Ref so we can access current votesCast inside async callbacks without
  // stale-closure issues.
  const votesCastRef = useRef(votesCast);
  votesCastRef.current = votesCast;

  // ------------------------------------------------------------------
  // Load the next matchup from the server
  // ------------------------------------------------------------------

  const loadNextMatchup = useCallback(async () => {
    setState({ phase: "loading" });

    const response = await fetch(
      `/api/vote/next?week=${encodeURIComponent(weekSlug)}`,
    );

    if (response.status === 404) {
      setState({ phase: "all-seen" });
      return;
    }

    if (response.status === 403) {
      setState({ phase: "closed" });
      return;
    }

    const payload = (await response.json()) as VoteDeck & { error?: string };

    if (!response.ok) {
      setState({ phase: "error", message: payload.error ?? "Failed to load a matchup." });
      return;
    }

    setState({ phase: "matchup", matchup: payload });
  }, [weekSlug]);

  // ------------------------------------------------------------------
  // Submit a vote intent to the API
  // ------------------------------------------------------------------

  const submitVoteIntent = useCallback(
    async (intent: VoteIntent, matchup: VoteDeck): Promise<boolean> => {
      setState({ phase: "submitting", matchup, intent });

      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          weekSlug,
          matchupId: intent.matchupId,
          winnerEntryId: intent.winnerEntryId,
          loserEntryId: intent.loserEntryId,
          idempotencyKey: intent.idempotencyKey,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setState({
          phase: "error",
          message: payload.error ?? "Vote failed. Please try again.",
        });
        return false;
      }

      return true;
    },
    [weekSlug],
  );

  // ------------------------------------------------------------------
  // After a successful vote: increment count, load overlay or next
  // ------------------------------------------------------------------

  const handleVoteSuccess = useCallback(async () => {
    const nextCount = votesCastRef.current + 1;
    setVotesCast(nextCount);

    if (nextCount >= 10) {
      // Fetch leaderboard snapshot
      const res = await fetch(
        `/api/leaderboard?week=${encodeURIComponent(weekSlug)}`,
      );
      const rows: LeaderboardRow[] = res.ok
        ? ((await res.json()) as LeaderboardRow[])
        : initialLeaderboard;
      setState({ phase: "post-10", leaderboard: rows });
      return;
    }

    await loadNextMatchup();
  }, [weekSlug, initialLeaderboard, loadNextMatchup]);

  // ------------------------------------------------------------------
  // Vote button handler
  // ------------------------------------------------------------------

  const handleVoteClick = useCallback(
    async (winner: VoteDeckEntry, loser: VoteDeckEntry, matchup: VoteDeck) => {
      const intent: VoteIntent = {
        matchupId: matchup.matchupId,
        winnerEntryId: winner.id,
        loserEntryId: loser.id,
        idempotencyKey: crypto.randomUUID(),
      };

      const signedIn = await getIsSignedIn();
      setIsSignedIn(signedIn);

      if (!signedIn) {
        // Queue the intent and show the auth gate
        setState({ phase: "auth-gate", matchup, intent });
        return;
      }

      const ok = await submitVoteIntent(intent, matchup);
      if (ok) {
        await handleVoteSuccess();
      }
    },
    [submitVoteIntent, handleVoteSuccess],
  );

  // ------------------------------------------------------------------
  // Auth gate: user chose "Skip for now"
  // ------------------------------------------------------------------

  const handleSkip = useCallback(() => {
    void loadNextMatchup();
  }, [loadNextMatchup]);

  // ------------------------------------------------------------------
  // Auth gate: user signed in
  // ------------------------------------------------------------------

  const handleSignedIn = useCallback(async () => {
    setIsSignedIn(true);

    setState((prev) => {
      if (prev.phase !== "auth-gate") return prev;
      // Kick off vote submission — we need matchup + intent from state
      // but we can't use async directly in setState. Use an effect trick
      // via a ref instead (see below).
      return prev; // state update happens in the effect
    });

    // To avoid stale state in the callback we read the current state via ref
    // (see stateRef below).
    // The actual submission is done outside setState.
  }, []);

  // stateRef lets async callbacks read the latest state
  const stateRef = useRef(state);
  stateRef.current = state;

  // Attach a stable "signed-in" handler that reads the latest state from ref
  const handleSignedInStable = useCallback(async () => {
    setIsSignedIn(true);
    const current = stateRef.current;
    if (current.phase !== "auth-gate") {
      return;
    }
    const { matchup, intent } = current;
    const ok = await submitVoteIntent(intent, matchup);
    if (ok) {
      await handleVoteSuccess();
    }
  }, [submitVoteIntent, handleVoteSuccess]);

  // ------------------------------------------------------------------
  // Initial mount: load first matchup + detect sign-in status
  // ------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const [signedIn] = await Promise.all([
        getIsSignedIn(),
        // loadNextMatchup sets state; we guard with cancelled below
      ]);
      if (cancelled) return;
      setIsSignedIn(signedIn);
      await loadNextMatchup();
    }

    void init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekSlug]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  // --- Post-10 overlay ---
  if (state.phase === "post-10") {
    return (
      <div className="space-y-6">
        {/* Overlay card */}
        <div className="brutal-card p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-green)]">
            Voting sprint complete
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-[var(--ink)]">
            You&apos;ve voted 10 times! 🎉
          </h2>
          <p className="mt-2 text-base leading-7 text-[var(--muted)]">
            Here&apos;s the current leaderboard:
          </p>

          {/* Top-3 snapshot */}
          <div className="mt-4 space-y-2">
            {state.leaderboard.slice(0, 3).map((row) => (
              <div
                key={row.entrySlug}
                className="flex items-center gap-4"
                style={{
                  border: "2px solid #000",
                  padding: "0.5rem 0.75rem",
                  background: "#F5F5F5",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontWeight: 700,
                    fontSize: 18,
                    minWidth: 28,
                    color: "#000",
                  }}
                >
                  #{row.rank}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontWeight: 700,
                    fontSize: 15,
                    color: "#000",
                  }}
                >
                  {row.title}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 12,
                    color: "#555",
                  }}
                >
                  {Math.round(row.elo)} ELO
                </span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/leaderboard" className="brutal-btn brutal-btn-dark">
              Share the leaderboard →
            </a>
            <button
              type="button"
              className="brutal-btn brutal-btn-green"
              onClick={() => void loadNextMatchup()}
            >
              Keep voting →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- All seen ---
  if (state.phase === "all-seen") {
    return (
      <div className="brutal-card p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-green)]">
          All caught up
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-[var(--ink)]">
          You&apos;ve seen every matchup this round!
        </h2>
        <p className="mt-2 text-base leading-7 text-[var(--muted)]">
          Check back soon for new pairings, or browse the leaderboard.
        </p>
        <a href="/leaderboard" className="brutal-btn brutal-btn-green mt-5">
          View leaderboard
        </a>
      </div>
    );
  }

  // --- Voting closed ---
  if (state.phase === "closed") {
    return (
      <div className="brutal-card p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-red)]">
          Round over
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-[var(--ink)]">
          Voting has closed
        </h2>
        <p className="mt-2 text-base leading-7 text-[var(--muted)]">
          This round is finished. See who won on the leaderboard.
        </p>
        <a href="/leaderboard" className="brutal-btn brutal-btn-dark mt-5">
          View leaderboard
        </a>
      </div>
    );
  }

  // --- Error ---
  if (state.phase === "error") {
    return (
      <div className="space-y-4">
        <div
          className="brutal-card p-5"
          style={{ borderColor: "var(--accent-red)" }}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-red)]">
            Error
          </p>
          <p className="mt-2 text-base leading-7 text-[var(--ink)]">
            {state.message}
          </p>
          <button
            type="button"
            className="brutal-btn brutal-btn-dark mt-4"
            onClick={() => void loadNextMatchup()}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // --- Loading ---
  const isLoading = state.phase === "loading";
  const isSubmitting = state.phase === "submitting";
  const matchup =
    state.phase === "matchup" ||
    state.phase === "auth-gate" ||
    state.phase === "submitting"
      ? state.matchup
      : null;
  const showAuthGate = state.phase === "auth-gate";

  return (
    <>
      <div className="space-y-5">
        {/* Progress bar — only show to signed-in voters */}
        {isSignedIn && (
          <VoterProgress votesCast={votesCast} total={10} />
        )}

        {isLoading || isSubmitting ? (
          <div className="brutal-card p-8 text-base text-[var(--muted)]">
            {isSubmitting ? "Submitting your vote…" : "Loading the next matchup…"}
          </div>
        ) : matchup ? (
          <MatchupCards
            matchup={matchup}
            disabled={isSubmitting}
            onVote={handleVoteClick}
          />
        ) : (
          <div className="brutal-card p-8 text-base text-[var(--muted)]">
            No fresh matchups are available right now.
          </div>
        )}
      </div>

      {/* Auth gate modal rendered as a portal-like overlay */}
      {showAuthGate && (
        <AuthGateModal
          onSkip={handleSkip}
          onSignedIn={() => void handleSignedInStable()}
          returnTo="/vote"
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// MatchupCards sub-component
// ---------------------------------------------------------------------------

function MatchupCards({
  matchup,
  disabled,
  onVote,
}: {
  matchup: VoteDeck;
  disabled: boolean;
  onVote: (winner: VoteDeckEntry, loser: VoteDeckEntry, matchup: VoteDeck) => void;
}) {
  const pairs: [VoteDeckEntry, VoteDeckEntry][] = [
    [matchup.leftEntry, matchup.rightEntry],
    [matchup.rightEntry, matchup.leftEntry],
  ];

  return (
    <div className="vote-grid">
      {pairs.map(([entry, other], index) => {
        const isLeft = index === 0;
        return (
          <article key={entry.id} className="brutal-card overflow-hidden">
            <EntryMedia
              assetPath={entry.demoAssetPath}
              title={entry.title}
              className="h-56 sm:h-72"
            />
            <div className="space-y-4 border-t-[3px] border-[var(--ink)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="brutal-label">
                    {entry.foundingBuilder ? "Founding builder" : "Builder"}
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-[var(--ink)]">
                    {entry.title}
                  </h2>
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    border: "2px solid #000",
                    background: "var(--bg)",
                    padding: "0.2rem 0.5rem",
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: "#000",
                    whiteSpace: "nowrap",
                  }}
                >
                  {entry.builderName}
                </span>
              </div>

              <p
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "var(--muted)",
                }}
              >
                {entry.oneLiner}
              </p>

              {/* Action row */}
              <div className="flex flex-wrap gap-3">
                {/* VOTE button */}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onVote(entry, other, matchup)}
                  style={{
                    flex: "1 1 auto",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 56,
                    background: isLeft ? "#00FF41" : "#0033FF",
                    color: isLeft ? "#000" : "#fff",
                    border: "3px solid #000",
                    boxShadow: "4px 4px 0 #000",
                    fontFamily: "var(--font-mono, monospace)",
                    fontWeight: 700,
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                    transition: "transform 0.1s, box-shadow 0.1s",
                    borderRadius: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled) {
                      (e.currentTarget as HTMLButtonElement).style.transform =
                        "translate(-2px, -2px)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow =
                        "6px 6px 0 #000";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "4px 4px 0 #000";
                  }}
                  onMouseDown={(e) => {
                    if (!disabled) {
                      (e.currentTarget as HTMLButtonElement).style.transform =
                        "translate(2px, 2px)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow =
                        "2px 2px 0 #000";
                    }
                  }}
                  onMouseUp={(e) => {
                    if (!disabled) {
                      (e.currentTarget as HTMLButtonElement).style.transform =
                        "translate(-2px, -2px)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow =
                        "6px 6px 0 #000";
                    }
                  }}
                >
                  VOTE
                </button>

                {/* Open app */}
                <a
                  href={entry.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="brutal-btn brutal-btn-outline"
                  style={{ height: 56 }}
                >
                  Open app ↗
                </a>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
