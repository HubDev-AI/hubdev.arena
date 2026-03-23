"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ActivityEvent {
  id: number;
  type: "vote" | "submit" | "elo_change";
  text: string;
  timestamp: number;
  simulated?: boolean;
}

interface LeaderboardEntry {
  entrySlug: string;
  elo: number;
  wins: number;
  losses: number;
  [key: string]: unknown;
}

const MOCK_EVENTS: Array<{ type: ActivityEvent["type"]; text: string }> = [
  { type: "vote", text: "New vote cast in matchup" },
  { type: "vote", text: "Head-to-head vote recorded" },
  { type: "vote", text: "Voting streak completed" },
  { type: "vote", text: "Matchup decided" },
  { type: "elo_change", text: "ELO ratings updated" },
  { type: "elo_change", text: "Leaderboard position changed" },
  { type: "elo_change", text: "Rankings reshuffled" },
  { type: "submit", text: "New entry submitted for review" },
  { type: "submit", text: "Builder joined the arena" },
];

interface LivePulseProps {
  className?: string;
  weekSlug?: string;
}

export function LivePulse({ className = "", weekSlug }: LivePulseProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [counter, setCounter] = useState(0);
  const prevDataRef = useRef<LeaderboardEntry[] | null>(null);
  const hasRealDataRef = useRef(false);
  const [hasRealData, setHasRealData] = useState(false);

  const addEvent = useCallback((type: ActivityEvent["type"], text: string, simulated = false) => {
    setCounter((c) => c + 1);
    setEvents((prev) => {
      const newEvent: ActivityEvent = {
        type,
        text,
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
        simulated,
      };
      return [newEvent, ...prev].slice(0, 4);
    });
  }, []);

  const addMockEvent = useCallback(() => {
    // Stop generating mock events once real data has loaded
    if (hasRealDataRef.current) return;
    const template = MOCK_EVENTS[Math.floor(Math.random() * MOCK_EVENTS.length)];
    if (template) {
      addEvent(template.type, template.text, true);
    }
  }, [addEvent]);

  // Real leaderboard polling when weekSlug is provided
  useEffect(() => {
    if (!weekSlug) return;

    let cancelled = false;
    let isFirstFetch = true;

    const fetchAndCompare = async () => {
      try {
        const res = await fetch(`/api/leaderboard?week=${encodeURIComponent(weekSlug)}`, {
          headers: { "X-Requested-With": "XMLHttpRequest" },
        });
        if (!res.ok) return;
        const data = (await res.json()) as LeaderboardEntry[];
        if (cancelled) return;

        const prev = prevDataRef.current;

        if (isFirstFetch && data.length > 0) {
          // Mark that real data is now available — stop mock events
          isFirstFetch = false;
          hasRealDataRef.current = true;
          setHasRealData(true);
          const totalVotes = data.reduce((sum, e) => sum + (e.wins as number) + (e.losses as number), 0) / 2;
          // Clear any simulated events and replace with real seed
          setEvents([]);
          setCounter(0);
          addEvent("elo_change", `${data.length} entries competing \u00b7 ${Math.round(totalVotes)} votes`);
        }

        if (prev) {
          const prevMap = new Map(prev.map((e) => [e.entrySlug, e]));

          let eloChanged = false;
          let voteChanged = false;
          let newEntries = 0;

          for (const entry of data) {
            const old = prevMap.get(entry.entrySlug);
            if (!old) {
              newEntries++;
              continue;
            }
            if (entry.elo !== old.elo) {
              eloChanged = true;
            }
            if (entry.wins !== old.wins || entry.losses !== old.losses) {
              voteChanged = true;
            }
          }

          if (newEntries > 0) {
            addEvent("submit", newEntries === 1 ? "New entry submitted" : `${newEntries} new entries submitted`);
          }
          if (voteChanged) {
            addEvent("vote", "New vote cast");
          }
          if (eloChanged) {
            addEvent("elo_change", "ELO ratings updated");
          }
        }

        prevDataRef.current = data;
      } catch {
        // Silently ignore — will retry on next interval
      }
    };

    // Initial fetch
    void fetchAndCompare();

    const interval = setInterval(() => void fetchAndCompare(), 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [weekSlug, addEvent]);

  // Mock events — only used as initial seed before real data loads,
  // or as primary source when no weekSlug is provided
  useEffect(() => {
    if (weekSlug) {
      // Seed one mock event while waiting for the first real fetch
      addMockEvent();
      // No interval — real polling will take over
      return;
    }

    // No weekSlug: mock events are the primary source
    addMockEvent();
    const interval = setInterval(addMockEvent, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [weekSlug, addMockEvent]);

  const typeColors = {
    vote: "bg-[var(--accent-green)]",
    submit: "bg-[var(--accent-blue)]",
    elo_change: "bg-[var(--accent-yellow)]",
  };

  return (
    <div className={`brutal-card overflow-hidden p-0 ${className}`}>
      <div className="bg-black/40 px-5 py-3 flex items-center justify-between flow-border-bottom">
        <p className={`${hasRealData ? "live-indicator" : ""} font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)] neon-text`}>
          {hasRealData ? "Live activity" : "Activity"}
        </p>
        <span className="font-mono text-[10px] text-gray-500 pulse-glow">
          {counter} events
        </span>
      </div>
      <div className="divide-y divide-[var(--line)]">
        {events.map((event) => {
          const secsAgo = Math.max(0, Math.floor((Date.now() - event.timestamp) / 1000));
          const timeLabel = secsAgo < 5 ? "now" : secsAgo < 60 ? `${secsAgo}s` : `${Math.floor(secsAgo / 60)}m`;
          return (
            <div
              key={event.id}
              className="flex items-center gap-3 px-5 py-3 animate-slide-up"
            >
              <div className={`h-2 w-2 shrink-0 rounded-full ${typeColors[event.type]}`}>
                <div className={`h-2 w-2 rounded-full ${typeColors[event.type]} animate-ping`} />
              </div>
              <p className="text-xs text-[var(--text-secondary)] truncate">{event.text}</p>
              <span className="ml-auto shrink-0 font-mono text-[9px] text-gray-500">{timeLabel}</span>
            </div>
          );
        })}
        {events.length === 0 && (
          <div className="px-5 py-4 text-center">
            <p className="text-xs text-gray-500">Connecting to arena...</p>
          </div>
        )}
      </div>
    </div>
  );
}
