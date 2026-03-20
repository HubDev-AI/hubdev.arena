"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ActivityEvent {
  id: number;
  type: "vote" | "submit" | "elo_change";
  text: string;
  timestamp: number;
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
  { type: "elo_change", text: "ELO ratings updated" },
  { type: "vote", text: "Voting streak completed" },
  { type: "submit", text: "New entry submitted" },
  { type: "vote", text: "Head-to-head vote recorded" },
  { type: "elo_change", text: "Leaderboard position changed" },
];

interface LivePulseProps {
  className?: string;
  weekSlug?: string;
}

export function LivePulse({ className = "", weekSlug }: LivePulseProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [counter, setCounter] = useState(0);
  const prevDataRef = useRef<LeaderboardEntry[] | null>(null);

  const addEvent = useCallback((type: ActivityEvent["type"], text: string) => {
    setCounter((c) => c + 1);
    setEvents((prev) => {
      const newEvent: ActivityEvent = {
        type,
        text,
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
      };
      return [newEvent, ...prev].slice(0, 4);
    });
  }, []);

  const addMockEvent = useCallback(() => {
    const template = MOCK_EVENTS[Math.floor(Math.random() * MOCK_EVENTS.length)];
    if (template) {
      addEvent(template.type, template.text);
    }
  }, [addEvent]);

  // Real leaderboard polling when weekSlug is provided
  useEffect(() => {
    if (!weekSlug) return;

    let cancelled = false;

    const fetchAndCompare = async () => {
      try {
        const res = await fetch(`/api/leaderboard?week=${encodeURIComponent(weekSlug)}`);
        if (!res.ok) return;
        const data: LeaderboardEntry[] = await res.json();
        if (cancelled) return;

        const prev = prevDataRef.current;
        if (prev) {
          const prevMap = new Map(prev.map((e) => [e.entrySlug, e]));
          const currentSlugs = new Set(data.map((e) => e.entrySlug));

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

          // Also check if any entries were removed (unlikely but possible)
          for (const old of prev) {
            if (!currentSlugs.has(old.entrySlug)) {
              // Entry removed — treat as a change but don't generate a specific event
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
        // Silently ignore fetch errors — will retry on next interval
      }
    };

    // Initial fetch
    fetchAndCompare();

    const interval = setInterval(fetchAndCompare, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [weekSlug, addEvent]);

  // Simulated events as fallback when no weekSlug or no real changes
  useEffect(() => {
    if (weekSlug) return;

    // Initial event
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
        <p className="live-indicator font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)] neon-text">
          Live activity
        </p>
        <span className="font-mono text-[10px] text-gray-500 pulse-glow">
          {counter} events
        </span>
      </div>
      <div className="divide-y divide-[var(--line)]">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-center gap-3 px-5 py-3 animate-slide-up"
          >
            <div className={`h-2 w-2 shrink-0 rounded-full ${typeColors[event.type]}`}>
              <div className={`h-2 w-2 rounded-full ${typeColors[event.type]} animate-ping`} />
            </div>
            <p className="text-xs text-[var(--text-secondary)] truncate">{event.text}</p>
            <span className="ml-auto shrink-0 font-mono text-[9px] text-gray-400">now</span>
          </div>
        ))}
        {events.length === 0 && (
          <div className="px-5 py-4 text-center">
            <p className="text-xs text-gray-400">Waiting for activity...</p>
          </div>
        )}
      </div>
    </div>
  );
}
